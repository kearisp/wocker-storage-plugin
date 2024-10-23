import {Config, ConfigProperties} from "@wocker/core";

import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


type StorageType = typeof STORAGE_TYPE_MINIO | typeof STORAGE_TYPE_REDIS;

export type StorageConfigProps = ConfigProperties & {
    type: StorageType;
};

export class StorageConfig extends Config<StorageConfigProps> {
    public name: string;
    public type: StorageType;

    public constructor(props: StorageConfigProps) {
        super(props);

        const {
            name,
            type
        } = props;

        this.name = name;
        this.type = type;
    }

    public get containerName(): string {
        return `${this.type}-${this.name}.ws`;
    }

    public toJSON(): StorageConfigProps {
        return {
            name: this.name,
            type: this.type
        };
    }
}
