import {isValidBuketName} from "./isValidBuketName";


export const validateBucketName = (bucket: string): string | boolean => {
    if(!isValidBuketName(bucket)) {
        return "Bucket name must be 3-63 characters long and contain only lowercase letters, digits, dots and hyphens, starting and ending with a letter or digit";
    }

    return true;
}
