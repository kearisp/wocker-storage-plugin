import {ConfigCollection} from "@wocker/core";

import {Storage, StorageProps} from "./Storage";


export type ConfigProps = {
    default?: string;
    storages?: StorageProps[];
};

export abstract class Config {
    public default?: string;
    public storages: ConfigCollection<Storage, StorageProps>;

    public constructor(props: ConfigProps) {
        const {
            default: defaultStorage,
            storages = []
        } = props;

        this.default = defaultStorage;
        this.storages = new ConfigCollection(Storage, storages);
    }

    public getStorage(name?: string): Storage {
        if(!name) {
            if(!this.default)
                throw new Error("Default storage is not defined");

            const storage = this.storages.getConfig(this.default);

            if(!storage)
                throw new Error(`Default storage ${this.default} not found`);

            return storage;
        }

        const storage = this.storages.getConfig(name);

        if(!storage)
            throw new Error(`Storage ${name} not found`);

        return storage;
    }

    public removeStorage(name: string): void {
        const storage = this.storages.getConfig(name);

        if(!storage) {
            throw new Error(`Storage ${name} not found`);
        }

        this.storages.removeConfig(name);
    }

    public abstract save(): Promise<void>;

    public toJSON(): ConfigProps {
        return {
            default: this.default,
            storages: this.storages.toArray()
        };
    }
}
