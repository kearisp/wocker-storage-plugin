import {PluginConfigItem, PluginConfigItemProps} from "@wocker/core";

import {STORAGE_TYPE_MINIO, STORAGE_TYPE_REDIS} from "../env";

export type ConfigItemType = typeof STORAGE_TYPE_MINIO | typeof STORAGE_TYPE_REDIS;

export type ConfigItemProps = PluginConfigItemProps & {
    type: ConfigItemType;
};

export class ConfigItem<P extends ConfigItemProps = ConfigItemProps> extends PluginConfigItem<P> {
    public type: ConfigItemType;

    public constructor(props: P) {
        super(props);

        const {type} = props;

        this.type = type;
    }
}
