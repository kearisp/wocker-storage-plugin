import {
    Controller,
    Description,
    Command,
    Param,
    Option
} from "@wocker/core";

import {StorageService} from "../services/StorageService";
import {StorageType} from "../makes/Storage";


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
        type?: StorageType,
        @Option("user", {
            type: "string",
            alias: "u",
            description: "User name"
        })
        user?: string,
        @Option("password", {
            type: "string",
            alias: "p",
            description: "Password"
        })
        password?: string
    ): Promise<void> {
        await this.storageService.addStorage(name, type, user, password);
    }

    @Command("storage:destroy [name]")
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
        name?: string,
        @Option("restart", {
            type: "boolean",
            alias: "r",
            description: "Restarting storage container"
        })
        restart?: boolean
    ): Promise<void> {
        await this.storageService.start(name, restart);
    }

    @Command("storage:stop [name]")
    public async stop(
        @Param("name")
        name?: string
    ): Promise<void> {
        await this.storageService.stop(name);
    }

    @Command("storage:use <name>")
    public async use(
        @Param("name")
        name: string
    ): Promise<void> {
        await this.storageService.use(name);
    }
}
