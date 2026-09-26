enum StorageTypeEnum {
    MINIO = "minio",
    SEAWEEDFS = "seaweedfs"
}

export type StorageType = StorageTypeEnum;

export const StorageType = Object.assign({}, StorageTypeEnum, {
    label: (type: StorageTypeEnum) => {
        switch(type) {
            case StorageTypeEnum.MINIO:
                return "MinIO";

            case StorageTypeEnum.SEAWEEDFS:
                return "SeaweedFS";

            default:
                return type;
        }
    },
    values: () => Object.values(StorageTypeEnum),
    options: () => StorageType.values().map((type) => {
        return {
            label: StorageType.label(type),
            value: type
        };
    })
});
