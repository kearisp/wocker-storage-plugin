import {Config, ConfigProperties} from "@wocker/core";

import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


type StorageType = typeof STORAGE_TYPE_MINIO | typeof STORAGE_TYPE_REDIS;

export type StorageProps = ConfigProperties & {
    type: StorageType;
};

export class Storage extends Config<StorageProps> {
    public type: StorageType;

    public constructor(props: StorageProps) {
        super(props);

        const {type} = props;

        this.type = type;
    }

    public get containerName(): string {
        return `${this.type}-${this.name}.ws`;
    }
}
