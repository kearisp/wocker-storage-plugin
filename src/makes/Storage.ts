import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";


export type StorageType = typeof STORAGE_TYPE_MINIO | typeof STORAGE_TYPE_REDIS;

export type StorageProps = {
    name: string;
    type: StorageType;
    username: string;
    password: string;
    image?: string;
    imageName?: string;
    imageVersion?: string;
    volume?: string;
};

export class Storage {
    public name: string;
    public type: StorageType;
    public username: string;
    public password: string;
    public _image?: string;
    public _imageName?: string;
    public _imageVersion?: string;
    protected _volume?: string;

    public constructor(props: StorageProps) {
        const {
            name,
            type,
            username,
            password,
            image,
            imageName,
            imageVersion,
            volume
        } = props;

        this.name = name;
        this.type = type;
        this.username = username;
        this.password = password;
        this._image = image;
        this._imageName = imageName;
        this._imageVersion = imageVersion;
        this._volume = volume;
    }

    public get containerName(): string {
        return `${this.type}-${this.name}.ws`;
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
        if(!this._image) {
            let imageName = this._imageName,
                imageVersion = this._imageVersion;

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

        return this._image;
    }

    public set image(image: string) {
        const pattern = /^(?:[a-zA-Z0-9.-]+(?::\d+)?\/)?(?:[a-z0-9]+(?:[._-][a-z0-9]+)*\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/;

        if(!pattern.test(image)) {
            throw new Error("Invalid image format.");
        }

        this._image = image;
    }

    public set imageName(imageName: string) {
        const [, imageVersion] = this.imageTag.split(":");

        this._image = `${imageName}:${imageVersion}`;
    }

    public set imageVersion(imageVersion: string) {
        const [imageName] = this.imageTag.split(":");

        this._image = `${imageName}:${imageVersion}`;
    }

    public toObject(): StorageProps {
        return {
            name: this.name,
            type: this.type,
            image: this.imageTag,
            username: this.username,
            password: this.password
        };
    }
}
