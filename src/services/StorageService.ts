import {
    DockerService,
    Injectable,
    PluginConfigService
} from "@wocker/core";
import {promptText, promptSelect} from "@wocker/utils";

import {Storage} from "../makes/Storage";
import {Config, ConfigProps} from "../makes/Config";
import {ConfigItemType} from "../makes/ConfigItem";
import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


@Injectable()
export class StorageService {
    public constructor(
        protected readonly pluginConfigService: PluginConfigService,
        protected readonly dockerService: DockerService
    ) {}

    protected _config?: Config;

    public get config(): Config {
        if(!this._config) {
            this._config = this.getConfig();
        }

        return this._config;
    }

    public async addStorage(name?: string, type?: ConfigItemType): Promise<void> {
        const config = this.getConfig();

        if(!name) {
            name = await promptText({
                message: "Storage name:",
                type: "string"
            }) as string;
        }

        let storage = config.storages.getConfig(name);

        if(storage) {
            throw new Error(`Storage ${name} already exists`);
        }

        if(!type || ![STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS].includes(type)) {
            type = await promptSelect<ConfigItemType>({
                message: "Storage type:",
                options: [
                    {label: "Minio", value: STORAGE_TYPE_MINIO},
                    {label: "Redis", value: STORAGE_TYPE_REDIS}
                ]
            });
        }

        storage = new Storage({
            name,
            type
        });

        config.storages.setConfig(storage);

        await config.save();
    }

    public async destroyStorage(name: string): Promise<void> {
        const config = this.getConfig();

        config.storages.removeConfig(name);

        await config.save();
    }

    public async list(): Promise<string> {
        for(const storage of this.config.storages.items) {
            console.info(storage.name, storage.type, storage.containerName);
        }

        return "";
    }

    public async start(name?: string): Promise<void> {
        const storage = this.config.getStorage(name);

        if(!storage) {
            throw new Error(name ? `Storage ${name} not found` : "Default storage not found");
        }

        console.log(storage);
    }

    public async stop(name?: string): Promise<void> {
        const storage = this.config.getStorage(name);

        if(!storage) {
            throw new Error(name ? `Storage ${name} not found` : "Default storage not found");
        }

        console.log(storage);
    }

    public getConfig(): Config {
        const fs = this.pluginConfigService.fs;

        const data: ConfigProps = fs.exists("config.json")
            ? this.pluginConfigService.fs.readJSON("config.json")
            : {
                default: "default",
                items: [
                    {
                        name: "default",
                        type: STORAGE_TYPE_MINIO
                    }
                ]
            };

        return new class extends Config {
            public async save(): Promise<void> {
                fs.writeJSON("config.json", this.toJSON());
            }
        }(data);
    }
}
