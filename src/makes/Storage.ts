import {Image} from "@wocker/utils";
import {StorageType} from "../types/StorageType";
import {StorageStyle} from "../types/StorageStyle";


export type StorageProps = {
    name: string;
    type: StorageType;
    style: StorageStyle;
    username: string;
    password: string;
    buckets?: string[];
    image?: string;
    /** @deprecated */
    imageName?: string;
    /** @deprecated */
    imageVersion?: string;
    volume?: string;
};

export class Storage {
    public name: string;
    public type: StorageType;
    public style: StorageStyle;
    public username: string;
    public password: string;
    public buckets: string[];
    public _image?: string;
    protected _volume?: string;

    public constructor(props: StorageProps) {
        const {
            name,
            type,
            style = StorageStyle.PATH,
            username,
            password,
            buckets = [],
            imageName,
            imageVersion,
            image = imageName && imageVersion ? `${imageName}:${imageVersion}` : imageName,
            volume
        } = props;

        this.name = name;
        this.type = type;
        this.style = style;
        this.username = username;
        this.password = password;
        this.buckets = buckets;
        this._image = image;
        this._volume = volume;
    }

    public get containerName(): string {
        return `${this.type}-${this.name}.ws`;
    }

    public get aliases(): string[] {
        return this.buckets.map((bucket) => {
            return `${bucket}.${this.type}-${this.name}.ws`;
        });
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

    public get image(): string {
        if(!this._image) {
            return "minio/minio:latest";
        }

        return this._image;
    }

    public set image(image: string) {
        if(!Image.isValid(image)) {
            throw new Error("Invalid image format.");
        }

        this._image = image;
    }

    public toObject(): StorageProps {
        return {
            name: this.name,
            type: this.type,
            style: this.style,
            image: this.image,
            username: this.username,
            password: this.password,
            buckets: this.buckets.length > 0 ? this.buckets : undefined,
            volume: this.volume
        };
    }
}
