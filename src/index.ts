import {Plugin, PluginConfigService} from "@wocker/core";
import {StorageController} from "./controller/StorageController";
import {StorageService} from "./services/StorageService";
import {MinioProvider} from "./providers/MinioProvider";


@Plugin({
    name: "storage",
    controllers: [
        StorageController
    ],
    providers: [
        PluginConfigService,
        StorageService,
        MinioProvider
    ]
})
export default class StoragePlugin {}
