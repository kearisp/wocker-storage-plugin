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
        username?: string,
        @Option("password", {
            type: "string",
            alias: "p",
            description: "Password"
        })
        password?: string,
        @Option("image", {
            type: "string",
            alias: "i",
            description: "The image name to start the service with"
        })
        imageName?: string,
        @Option("image-version", {
            type: "string",
            alias: "I",
            description: "The image version to start the service with"
        })
        imageVersion?: string
    ): Promise<void> {
        await this.storageService.create({
            name,
            type,
            username,
            password,
            imageName,
            imageVersion
        });
    }

    @Command("storage:destroy [name]")
    @Description("Destroys a storage service and deletes all associated volumes.")
    public async destroy(
        @Param("name")
        name: string,
        @Option("yes", {
            type: "boolean",
            alias: "y",
            description: "Confirm destruction without prompting for confirmation."
        })
        yes?: boolean,
        @Option("force", {
            type: "boolean",
            alias: "f",
            description: "Force deletion even if the storage is set as default"
        })
        force?: boolean
    ): Promise<void> {
        await this.storageService.destroy(name, yes, force);
    }

    @Command("storage:upgrade [name]")
    @Description("Upgrades an existing storage service by changing its settings such as volume, image name, or image version.")
    public async upgrade(
        @Param("name")
        name?: string,
        @Option("volume", {
            type: "string",
            alias: "v",
            description: "The volume to start the service with"
        })
        volume?: string,
        @Option("image", {
            type: "string",
            alias: "i",
            description: "The image name to start the service with"
        })
        imageName?: string,
        @Option("image-version", {
            type: "string",
            alias: "I",
            description: "The image version to start the service with"
        })
        imageVersion?: string
    ): Promise<void> {
        this.storageService.upgrade({
            name,
            volume,
            imageName,
            imageVersion
        });
    }

    @Command("storage:ls")
    @Description("Displays a list of all configured storage services.")
    public async list(): Promise<string> {
        return this.storageService.list();
    }

    @Command("storage:start [name]")
    @Description("Starts a storage service. If the service is already running, use the restart option to restart it.")
    public async start(
        @Param("name")
        name?: string,
        @Option("restart", {
            type: "boolean",
            alias: "r",
            description: "Restart the storage service if it is already running"
        })
        restart?: boolean
    ): Promise<void> {
        await this.storageService.start(name, restart);
    }

    @Command("storage:stop [name]")
    @Description("Stops a running storage service.")
    public async stop(
        @Param("name")
        name?: string
    ): Promise<void> {
        await this.storageService.stop(name);
    }

    @Command("storage:use <name>")
    @Description("Sets the specified storage service as the current one for all subsequent operations.")
    public async use(
        @Param("name")
        name: string
    ): Promise<void> {
        await this.storageService.use(name);
    }
}
