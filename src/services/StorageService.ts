import {
    Injectable,
    AppConfigService,
    PluginConfigService,
    ProxyService,
    DockerService
} from "@wocker/core";
import {promptText, promptSelect, promptConfirm} from "@wocker/utils";
import CliTable from "cli-table3";

import {Storage, StorageType, StorageProps} from "../makes/Storage";
import {Config, ConfigProps} from "../makes/Config";
import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


@Injectable()
export class StorageService {
    protected _config?: Config;

    public constructor(
        protected readonly appConfigService: AppConfigService,
        protected readonly pluginConfigService: PluginConfigService,
        protected readonly proxyService: ProxyService,
        protected readonly dockerService: DockerService
    ) {}

    public get config(): Config {
        if(!this._config) {
            const fs = this.pluginConfigService.fs;
            const data: ConfigProps = fs.exists("config.json")
                ? fs.readJSON("config.json")
                : {};

            this._config = new class extends Config {
                public async save(): Promise<void> {
                    fs.writeJSON("config.json", this.toJSON());
                }
            }(data);
        }

        return this._config;
    }

    public async create(storageProps: Partial<StorageProps> = {}): Promise<void> {
        if(storageProps.name && this.config.hasStorage(storageProps.name)) {
            console.info(`Storage "${storageProps.name}" already exists`);
            delete storageProps.name;
        }

        if(!storageProps.name) {
            storageProps.name = await promptText({
                message: "Storage name:",
                type: "string",
                validate: (name?: string) => {
                    return true;
                }
            }) as string;
        }

        if(!storageProps.type || ![STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS].includes(storageProps.type)) {
            storageProps.type = await promptSelect<StorageType>({
                message: "Storage type:",
                options: [
                    {label: "MinIO", value: STORAGE_TYPE_MINIO},
                    // {label: "Redis", value: STORAGE_TYPE_REDIS}
                ]
            });
        }

        if(!storageProps.username || storageProps.username.length < 3) {
            storageProps.username = await promptText({
                required: true,
                message: "Username:",
                type: "string",
                validate(value) {
                    if(!value || value.length < 3) {
                        return "Username length should be at least 3 characters";
                    }

                    return true;
                }
            }) as string;
        }

        if(!storageProps.password || storageProps.password.length < 8) {
            storageProps.password = await promptText({
                required: true,
                message: "Password:",
                type: "password",
                validate(value) {
                    if(!value || value.length < 8) {
                        return "Password length should be at least 8 characters";
                    }

                    return true;
                }
            }) as string;

            const passwordConfirm = await promptText({
                message: "Confirm password:",
                type: "password"
            }) as string;

            if(storageProps.password !== passwordConfirm) {
                throw new Error("Passwords do not match")
            }
        }

        this.config.setStorage(new Storage(storageProps as StorageProps));

        await this.config.save();
    }

    public async destroy(name: string, yes?: boolean, force?: boolean): Promise<void> {
        const storage = this.config.getStorage(name);

        if(!force && storage.name === this.config.default) {
            throw new Error(`Cannot delete the default storage. To proceed, use the --force or -f option.`);
        }

        if(!yes) {
            const confirm = await promptConfirm({
                message: `Are you sure you want to delete the "${storage.name}" storage? This action cannot be undone and all data will be lost.`,
                default: false
            });

            if(!confirm) {
                throw new Error("Aborted");
            }
        }

        switch(storage.type) {
            case STORAGE_TYPE_MINIO: {
                await this.dockerService.removeContainer(storage.containerName);

                if(this.appConfigService.isVersionGTE && this.appConfigService.isVersionGTE("1.0.19")) {
                    if(await this.dockerService.hasVolume(storage.volumeName)) {
                        await this.dockerService.rmVolume(storage.volumeName);
                    }
                }
                break;
            }

            case STORAGE_TYPE_REDIS:
                break;
        }

        this.config.removeStorage(name);

        await this.config.save();
    }

    public async list(): Promise<string> {
        const table = new CliTable({
            head: ["Name", "Type", "Container name"]
        });

        for(const storage of this.config.storages) {
            table.push([storage.name + (this.config.default === storage.name ? " (default)" : ""), storage.type, storage.containerName]);
        }

        return table.toString();
    }

    public async start(name?: string, restart?: boolean): Promise<void> {
        if(!name && !this.config.default) {
            await this.create();
        }

        const storage = this.config.getStorageOrDefault(name);

        switch(storage.type) {
            case STORAGE_TYPE_MINIO: {
                if(restart) {
                    await this.dockerService.removeContainer(storage.containerName);
                }

                let container = await this.dockerService.getContainer(storage.containerName);

                if(!container) {
                    container = await this.dockerService.createContainer({
                        cmd: ["server", "/data", "--address", ":80", "--console-address", ":9000"],
                        name: storage.containerName,
                        image: storage.imageTag,
                        env: {
                            VIRTUAL_HOST: storage.containerName,
                            VIRTUAL_PORT: "9000",
                            MINIO_ROOT_USER: storage.username,
                            MINIO_ROOT_PASSWORD: storage.password
                        },
                        volumes: [
                            `${storage.volumeName}:/data`
                        ]
                    });
                }

                const {
                    State: {
                        Running
                    }
                } = await container.inspect();

                if(!Running) {
                    await container.start();
                    await this.proxyService.start();
                }
                break;
            }

            case STORAGE_TYPE_REDIS: {
                break;
            }
        }
    }

    public async stop(name?: string): Promise<void> {
        const storage = this.config.getStorageOrDefault(name);

        switch(storage.type) {
            case STORAGE_TYPE_MINIO: {
                await this.dockerService.removeContainer(storage.containerName);
                break;
            }

            case STORAGE_TYPE_REDIS: {
                break;
            }
        }
    }

    public async use(name: string): Promise<void> {
        const storage = this.config.getStorage(name);

        this.config.default = storage.name;

        await this.config.save();
    }
}
