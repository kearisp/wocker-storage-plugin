import {Storage, StorageProps} from "./Storage";


export type ConfigProps = {
    default?: string;
    storages?: StorageProps[];
};

export abstract class Config {
    public default?: string;
    public storages: Storage[];

    public constructor(props: ConfigProps) {
        const {
            default: defaultStorage,
            storages = []
        } = props;

        this.default = defaultStorage;
        this.storages = storages.map((props) => new Storage(props));
    }

    public hasStorage(name: string): boolean {
        const storage = this.storages.find((storage) => storage.name === name);

        return !!storage;
    }

    public getDefaultStorage(): Storage {
        if(!this.default) {
            throw new Error("Default storage is not defined");
        }

        return this.getStorage(this.default);
    }

    public getStorage(name: string): Storage {
        if(!name) {
            throw new Error("Storage name is not provided");
        }

        const storage = this.storages.find((storage) => {
            return storage.name === name;
        });

        if(!storage) {
            throw new Error(`Storage "${name}" not found`);
        }

        return storage;
    }

    public getStorageOrDefault(name?: string): Storage {
        if(!name) {
            return this.getDefaultStorage();
        }

        return this.getStorage(name);
    }

    public setStorage(storage: Storage): void {
        let exists = false;

        for(let i = 0; i < this.storages.length; i++) {
            if(this.storages[i].name === storage.name) {
                exists = true;
                this.storages[i] = storage;
            }
        }

        if(!exists) {
            this.storages.push(storage);
        }

        if(!this.default) {
            this.default = storage.name;
        }
    }

    public removeStorage(name: string): void {
        this.storages = this.storages.filter((storage) => storage.name !== name);

        if(this.default === name) {
            delete this.default;
        }
    }

    public abstract save(): Promise<void>;

    public toJSON(): ConfigProps {
        return {
            default: this.default,
            storages: this.storages.map((storage) => storage.toObject())
        };
    }
}
