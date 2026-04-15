enum StorageTypeEnum {
    MINIO = "minio"
}

export type StorageType = StorageTypeEnum;

export const StorageType = Object.assign({}, StorageTypeEnum, {
    label: (type: StorageTypeEnum) => {
        switch(type) {
            case StorageTypeEnum.MINIO:
                return "MinIO";

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
