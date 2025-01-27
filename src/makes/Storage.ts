import {Config, ConfigProperties} from "@wocker/core";

import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


export type StorageType = typeof STORAGE_TYPE_MINIO | typeof STORAGE_TYPE_REDIS;

export type StorageProps = ConfigProperties & {
    type: StorageType;
    username: string;
    password: string;
};

export class Storage extends Config<StorageProps> {
    public type: StorageType;
    public username: string;
    public password: string;
    public imageName?: string;
    public imageVersion?: string;

    public constructor(props: StorageProps) {
        super(props);

        const {
            type,
            username,
            password
        } = props;

        this.type = type;
        this.username = username;
        this.password = password;
    }

    public get containerName(): string {
        return `${this.type}-${this.name}.ws`;
    }

    public get volumeName(): string {
        return `wocker-storage-${this.type}-${this.name}`;
    }

    public get imageTag(): string {
        let imageName = this.imageName,
            imageVersion = this.imageVersion;

        if(!imageName || !imageVersion) {
            switch(this.type) {
                case STORAGE_TYPE_MINIO:
                    imageName = "minio/minio";
                    imageVersion = "latest";
                    break;

                case STORAGE_TYPE_REDIS:
                    imageName = "redis";
                    imageVersion = "latest";
                    break;
            }
        }

        return `${imageName}:${imageVersion}`;
    }
}
