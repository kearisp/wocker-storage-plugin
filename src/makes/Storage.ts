import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


export type StorageType = typeof STORAGE_TYPE_MINIO | typeof STORAGE_TYPE_REDIS;

export type StorageProps = {
    name: string;
    type: StorageType;
    username: string;
    password: string;
    imageName?: string;
    imageVersion?: string;
    volume?: string;
};

export class Storage {
    public name: string;
    public type: StorageType;
    public username: string;
    public password: string;
    public imageName?: string;
    public imageVersion?: string;
    protected _volume?: string;

    public constructor(props: StorageProps) {
        const {
            name,
            type,
            username,
            password,
            imageName,
            imageVersion,
            volume
        } = props;

        this.name = name;
        this.type = type;
        this.username = username;
        this.password = password;
        this.imageName = imageName;
        this.imageVersion = imageVersion;
        this._volume = volume;
    }

    public get containerName(): string {
        return `${this.type}-${this.name}.ws`;
    }

    public get volumeName(): string {
        return `wocker-storage-${this.type}-${this.name}`;
    }

    public get volume(): string {
        if(!this._volume) {
            this._volume = this.defaultVolume;
        }

        return this._volume;
    }

    public set volume(volume: string) {
        this._volume = volume;
    }

    public get defaultVolume(): string {
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

    public toObject(): StorageProps {
        return {
            name: this.name,
            type: this.type,
            imageName: this.imageName,
            imageVersion: this.imageVersion,
            username: this.username,
            password: this.password
        };
    }
}
