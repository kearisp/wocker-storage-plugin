export type RedisConfigProps = {
    name: string;
    user?: string;
    password?: string;
};

export class RedisConfig {
    public name: string;
    public user?: string;
    public password?: string;

    public constructor(props: RedisConfigProps) {
        const {
            name,
            user,
            password
        } = props;

        this.name = name;
        this.user = user;
        this.password = password;
    }
}