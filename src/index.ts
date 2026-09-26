import {Plugin, PluginConfigService} from "@wocker/core";
import {StorageController} from "./controller/StorageController";
import {StorageService} from "./services/StorageService";
import {MinioProvider} from "./providers/MinioProvider";
import {SeaweedfsProvider} from "./providers/SeaweedfsProvider";


@Plugin({
    name: "storage",
    controllers: [
        StorageController
    ],
    providers: [
        PluginConfigService,
        StorageService,
        MinioProvider,
        SeaweedfsProvider
    ]
})
export default class StoragePlugin {}
