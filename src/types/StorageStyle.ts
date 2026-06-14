enum StorageStyleEnum {
    PATH = "path",
    SUBDOMAIN = "subdomain"
}

export type StorageStyle = StorageStyleEnum;

export const StorageStyle = Object.assign({}, StorageStyleEnum, {
    label: (style: StorageStyleEnum): string => {
        switch(style) {
            case StorageStyleEnum.PATH:
                return "Path";

            case StorageStyleEnum.SUBDOMAIN:
                return "Subdomain";

            default:
                return style;
        }
    },
    options: () => StorageStyle.values().map((style) => {
        return {
            label: StorageStyle.label(style),
            value: style
        };
    }),
    values: (): StorageStyleEnum[] => Object.values(StorageStyleEnum)
});
