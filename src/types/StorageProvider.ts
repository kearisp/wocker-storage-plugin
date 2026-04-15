import {Storage} from "../makes/Storage";


export abstract class StorageProvider {
    public abstract start(storage: Storage, restart?: boolean): Promise<void>;
    public abstract createBucket(storage: Storage, bucket: string): Promise<boolean>;
    public abstract deleteBucket(storage: Storage, bucket: string, force?: boolean): Promise<boolean>;
}
