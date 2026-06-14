const BUCKET_NAME_REGEXP = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;


export const isValidBuketName = (bucket: string): boolean => {
    return BUCKET_NAME_REGEXP.test(bucket);
};
