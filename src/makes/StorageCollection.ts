import {StorageConfig, StorageConfigProps} from "./StorageConfig";


export class StorageCollection {
    public storages: StorageConfig[];

    public constructor(storages: StorageConfigProps[]) {
        this.storages = storages.map((config) => {
            return new StorageConfig(config);
        });
    }

    public findStorage(name: string) {
        return this.storages.find((storage) => {
            return storage.name === name;
        });
    }

    public addOrUpdateStorage(storage: StorageConfig): void {

    }

    public removeStorage(name: string): void {
        const index = this.storages.findIndex((storage) => {
            return storage.name === name;
        });

        if(index === -1) {
            return;
        }

        this.storages = [
            ...this.storages.slice(0, index),
            ...this.storages.slice(index + 1)
        ];
    }

    public toArray(): StorageConfigProps[] {
        return this.storages.map((storage) => {
            return storage.toJSON();
        });
    }
}
