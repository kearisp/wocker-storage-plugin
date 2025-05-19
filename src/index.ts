import {Plugin, PluginConfigService} from "@wocker/core";
import {StorageController} from "./controller/StorageController";
import {StorageService} from "./services/StorageService";


@Plugin({
    name: "storage",
    controllers: [
        StorageController
    ],
    providers: [
        PluginConfigService,
        StorageService
    ]
})
export default class StoragePlugin {}
