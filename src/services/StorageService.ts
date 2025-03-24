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
                public save(): void {
                    if(!fs.exists()) {
                        fs.mkdir("", {
                            recursive: true
                        });
                    }

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
                    if(!name) {
                        return "Storage name is required";
                    }

                    if(this.config.hasStorage(name)) {
                        return `Storage "${name}" is already exists`;
                    }

                    return true;
                }
            }) as string;
        }

        if(storageProps.type && ![STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS].includes(storageProps.type)) {
            delete storageProps.type;
        }

        if(!storageProps.type) {
            storageProps.type = await promptSelect<StorageType>({
                message: "Storage type:",
                options: [
                    {label: "MinIO", value: STORAGE_TYPE_MINIO},
                    // {label: "Redis", value: STORAGE_TYPE_REDIS}
                ]
            });
        }

        if(storageProps.username && storageProps.username.length < 3) {
            delete storageProps.username;
        }

        if(!storageProps.username) {
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

        if(storageProps.password && storageProps.password.length < 8) {
            console.info("Password length should be at least 8 characters");
            delete storageProps.password;
        }

        if(!storageProps.password) {
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
        this.config.save();
    }

    public upgrade(storageProps: Partial<StorageProps> = {}): void {
        const storage = this.config.getStorageOrDefault(storageProps.name);

        let changed = false;

        if(storageProps.volume) {
            storage.volume = storageProps.volume;
            changed = true;
        }

        if(storageProps.imageName) {
            storage.imageName = storageProps.imageName;
            changed = true;
        }

        if(storageProps.imageVersion) {
            storage.imageVersion = storageProps.imageVersion;
            changed = true;
        }

        if(!changed) {
            return;
        }

        this.config.setStorage(storage);
        this.config.save();
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

                if(storage.volume !== storage.defaultVolume) {
                    console.info(`Deletion of custom volume "${storage.volume}" skipped.`);
                    break;
                }

                if(this.pluginConfigService.isVersionGTE("1.0.19")) {
                    if(await this.dockerService.hasVolume(storage.volume)) {
                        await this.dockerService.rmVolume(storage.volume);
                    }
                }
                break;
            }

            case STORAGE_TYPE_REDIS:
                break;
        }

        this.config.removeStorage(name);
        this.config.save();
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

        if(!this.pluginConfigService.isVersionGTE("1.0.19")) {
            throw new Error("Please update wocker for using volume storage");
        }

        if(!await this.dockerService.hasVolume(storage.volume)) {
            await this.dockerService.createVolume(storage.volume);
        }

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
                            `${storage.volume}:/data`
                        ]
                    });
                }

                const {
                    State: {
                        Running
                    }
                } = await container.inspect();

                await this.proxyService.start();

                if(Running) {
                    console.info(`Storage "${storage.name}" is already running at http://${storage.containerName}`);
                    break;
                }

                await container.start();
                console.info(`Storage "${storage.name}" started at http://${storage.containerName}`);
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

        this.config.save();
    }
}
