import {
    Controller,
    Description,
    Command,
    Param,
    Option
} from "@wocker/core";

import {StorageService} from "../services/StorageService";
import {ConfigItemType} from "../makes/ConfigItem";


@Controller()
export class StorageController {
    public constructor(
        protected readonly storageService: StorageService
    ) {}

    @Command("storage:create [name]")
    @Description("Creating storage")
    public async create(
        @Param("name")
        name?: string,
        @Option("type", {
            type: "string",
            description: "Storage type"
        })
        type?: ConfigItemType
    ): Promise<void> {
        await this.storageService.addStorage(name, type);
    }

    @Command("storage:destroy <name>")
    public async destroy(
        @Param("name")
        name: string
    ): Promise<void> {
        await this.storageService.destroyStorage(name);
    }

    @Command("storage:ls")
    public async list(): Promise<string> {
        return this.storageService.list();
    }

    @Command("storage:start [name]")
    public async start(
        @Param("name")
        name?: string
    ): Promise<void> {
        await this.storageService.start(name);
    }

    @Command("storage:stop [name]")
    public async stop(
        @Param("name")
        name?: string
    ): Promise<void> {
        await this.storageService.stop(name);
    }
}
