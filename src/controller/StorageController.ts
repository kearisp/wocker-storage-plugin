import {
    Controller,
    Description,
    Command,
    Param,
    Option
} from "@wocker/core";
import {StorageService} from "../services/StorageService";
import {StorageType} from "../types/StorageType";
import {StorageStyle} from "../types/StorageStyle";


@Controller()
@Description("Storage commands")
export class StorageController {
    public constructor(
        protected readonly storageService: StorageService
    ) {}

    @Command("storage:create [name]")
    @Description("Creating storage")
    public async create(
        @Param("name")
        name?: string,
        @Option("type")
        @Description(`Storage type (${StorageType.values().join(", ")})`)
        type?: StorageType,
        @Option("style")
        @Description(`Storage style (${StorageStyle.values().join(", ")})`)
        style?: StorageStyle,
        @Option("user", "u")
        @Description("User name")
        username?: string,
        @Option("password", "p")
        @Description("Password")
        password?: string,
        @Option("image", "i")
        @Description("The image name to start the service with")
        image?: string
    ): Promise<void> {
        await this.storageService.create({
            name,
            type,
            style,
            username,
            password,
            image
        });
    }

    @Command("storage:destroy [name]")
    @Description("Destroys a storage service and deletes all associated volumes.")
    public async destroy(
        @Param("name")
        name: string,
        @Option("yes", "y")
        @Description("Confirm destruction without prompting for confirmation.")
        yes?: boolean,
        @Option("force", "f")
        @Description("Force deletion even if the storage is set as default")
        force?: boolean
    ): Promise<void> {
        await this.storageService.destroy(name, yes, force);
    }

    @Command("storage:upgrade [name]")
    @Description("Upgrades an existing storage service by changing its settings such as volume, image name, or image version.")
    public async upgrade(
        @Param("name")
        name?: string,
        @Option("style")
        @Description(`Storage style (${StorageStyle.values().join(", ")})`)
        style?: StorageStyle,
        @Option("volume", "v")
        @Description("The volume to start the service with")
        volume?: string,
        @Option("image", "i")
        @Description("The image name to start the service with")
        image?: string
    ): Promise<void> {
        this.storageService.upgrade({
            name,
            style,
            volume,
            image
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
        @Option("restart", "r")
        @Description("Restart the storage service if it is already running")
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

    @Command("storage:create-bucket [bucket]")
    @Command("storage:create-bucket <name>/<bucket>")
    public async createBucket(
        @Param("name")
        name?: string,
        @Param("bucket")
        bucket?: string
    ) {
        await this.storageService.createBucket(name, bucket);
    }

    @Command("storage:delete-bucket [bucket]")
    @Command("storage:delete-bucket <name>/<bucket>")
    public async deleteBucket(
        @Param("name")
        name?: string,
        @Param("bucket")
        bucket?: string,
        @Option("yes", "y")
        yes?: boolean,
        @Option("force", "f")
        force?: boolean
    ) {
        await this.storageService.deleteBucket(name, bucket, yes, force);
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
