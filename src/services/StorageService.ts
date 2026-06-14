import {
    Injectable,
    PluginConfigService,
    DockerService
} from "@wocker/core";
import {promptInput, promptSelect, promptConfirm} from "@wocker/prompts";
import CliTable from "cli-table3";
import {MinioProvider} from "../providers/MinioProvider";
import {Storage, StorageProps} from "../makes/Storage";
import {StorageType} from "../types/StorageType";
import {StorageStyle} from "../types/StorageStyle";
import {StorageProvider} from "../types/StorageProvider";
import {Config} from "../makes/Config";


@Injectable()
export class StorageService {
    protected _config?: Config;

    public constructor(
        protected readonly pluginConfigService: PluginConfigService,
        protected readonly minioProvider: MinioProvider,
        protected readonly dockerService: DockerService
    ) {}

    public get config(): Config {
        if(!this._config) {
            this._config = this.pluginConfigService.getConfig(Config);
        }

        return this._config;
    }

    public provider(type: StorageType): StorageProvider {
        switch(type) {
            case StorageType.MINIO:
                return this.minioProvider;
        }
    }

    public async create(storageProps: Partial<StorageProps> = {}): Promise<void> {
        if(storageProps.name && this.config.hasStorage(storageProps.name)) {
            console.info(`Storage "${storageProps.name}" already exists`);
            delete storageProps.name;
        }

        if(!storageProps.name) {
            storageProps.name = await promptInput({
                message: "Storage name",
                type: "text",
                required: "Storage name is required",
                validate: (name?: string) => {
                    if(name && this.config.hasStorage(name)) {
                        return `Storage "${name}" is already exists`;
                    }

                    return true;
                }
            }) as string;
        }

        if(storageProps.type && !StorageType.values().includes(storageProps.type)) {
            delete storageProps.type;
        }

        if(!storageProps.type) {
            storageProps.type = await promptSelect<StorageType>({
                message: "Storage type",
                options: StorageType.options()
            });
        }

        if(storageProps.style && !StorageStyle.values().includes(storageProps.style)) {
            delete storageProps.style;
        }

        if(!storageProps.style) {
            storageProps.style = await promptSelect<StorageStyle>({
                message: "Storage address style",
                options: StorageStyle.options()
            });
        }

        if(storageProps.username && storageProps.username.length < 3) {
            delete storageProps.username;
        }

        if(!storageProps.username) {
            storageProps.username = await promptInput({
                required: true,
                message: "Username",
                type: "text",
                validate(value) {
                    if(!value || value.length < 3) {
                        return "Username length should be at least 3 characters";
                    }

                    return true;
                }
            });
        }

        if(storageProps.password && storageProps.password.length < 8) {
            console.info("Password length should be at least 8 characters");
            delete storageProps.password;
        }

        if(!storageProps.password) {
            storageProps.password = await promptInput({
                required: true,
                message: "Password",
                type: "password",
                validate(value) {
                    if(!value || value.length < 8) {
                        return "Password length should be at least 8 characters";
                    }

                    return true;
                }
            });

            const passwordConfirm = await promptInput({
                message: "Confirm password",
                type: "password"
            });

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

        if(storageProps.style) {
            storage.style = storageProps.style;
            changed = true;
        }

        if(storageProps.volume) {
            storage.volume = storageProps.volume;
            changed = true;
        }

        if(storageProps.image) {
            storage.image = storageProps.image;
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
            case StorageType.MINIO: {
                if(!this.pluginConfigService.isVersionGTE("1.0.19")) {
                    throw new Error("Please update wocker for using volume storage");
                }

                await this.dockerService.removeContainer(storage.containerName);

                if(storage.volume !== storage.defaultVolume) {
                    console.info(`Deletion of custom volume "${storage.volume}" skipped.`);
                    break;
                }

                if(await this.dockerService.hasVolume(storage.volume)) {
                    await this.dockerService.rmVolume(storage.volume);
                }
                break;
            }
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

        await this.provider(storage.type).start(storage, restart);
    }

    public async stop(name?: string): Promise<void> {
        const storage = this.config.getStorageOrDefault(name);

        switch(storage.type) {
            case StorageType.MINIO: {
                await this.dockerService.removeContainer(storage.containerName);
                break;
            }
        }
    }

    public async createBucket(name?: string, bucket?: string): Promise<void> {
        const storage = this.config.getStorageOrDefault(name);

        if(!bucket) {
            bucket = await promptInput({
                message: "Bucket",
                type: "text",
                required: true
            });
        }

        const success = await this.provider(storage.type).createBucket(storage, bucket);

        if(success) {
            if(!storage.buckets.includes(bucket)) {
                storage.buckets.push(bucket);
            }

            this.config.save();
        }

        if(storage.style === StorageStyle.SUBDOMAIN) {
            await this.start(name, true);
        }
    }

    public async deleteBucket(name?: string, bucket?: string, yes?: boolean, force?: boolean) {
        const storage = this.config.getStorageOrDefault(name);

        if(!bucket) {
            bucket = await promptInput({
                message: "Bucket",
                type: "text",
                required: true
            });
        }

        if(!yes) {
            yes = await promptConfirm({
                message: `Delete ${bucket}?`
            });
        }

        if(!yes) {
            throw new Error("Aborted");
        }

        const res = await this.provider(storage.type).deleteBucket(storage, bucket, force);

        if(res) {
            storage.buckets = storage.buckets.filter(b => b !== bucket);
            this.config.save();
        }
    }

    public async use(name: string): Promise<void> {
        const storage = this.config.getStorage(name);

        this.config.default = storage.name;

        this.config.save();
    }
}
