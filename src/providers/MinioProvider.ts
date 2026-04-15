import {
    Injectable,
    ProxyService,
    DockerService,
    ProcessService
} from "@wocker/core";
import colors from "yoctocolors-cjs";
import {Storage} from "../makes/Storage";
import {StorageProvider} from "../types/StorageProvider";
import {StorageStyle} from "../types/StorageStyle";


@Injectable()
export class MinioProvider extends StorageProvider {
    public constructor(
        protected readonly processService: ProcessService,
        protected readonly proxyService: ProxyService,
        protected readonly dockerService: DockerService
    ) {
        super();
    }

    public async start(storage: Storage, restart?: boolean) {
        if(restart) {
            await this.dockerService.removeContainer(storage.containerName);
        }

        let container = await this.dockerService.getContainer(storage.containerName);

        if(!container) {
            container = await this.dockerService.createContainer({
                cmd: ["server", "/data", "--address", ":80", "--console-address", ":9000"],
                name: storage.containerName,
                image: storage.image,
                aliases: storage.aliases,
                restart: "always",
                env: {
                    VIRTUAL_HOST_MULTIPORTS: JSON.stringify(
                        storage.style === StorageStyle.PATH ? {
                            [storage.containerName]: {
                                "/": {
                                    port: 80
                                }
                            },
                            [`console.${storage.containerName}`]: {
                                "/": {
                                    port: 9000
                                }
                            }
                        } : storage.aliases.reduce((res, subdomain) => {
                            return {
                                ...res,
                                [subdomain]: {
                                    "/": {
                                        port: 80
                                    }
                                }
                            };
                        }, {
                            [storage.containerName]: {
                                "/": {
                                    port: 9000
                                }
                            }
                        })
                    ),
                    ...storage.style === StorageStyle.SUBDOMAIN ? {
                        MINIO_DOMAIN: storage.containerName
                    } : {},
                    MINIO_ROOT_USER: storage.username,
                    MINIO_ROOT_PASSWORD: storage.password
                },
                volumes: [
                    `${storage.volume}:/data`
                ]
            });
        }

        const {
            State: {
                Running
            }
        } = await container.inspect();

        await this.proxyService.start();

        if(Running) {
            this.processService.write(`Storage "${storage.name}" is already running at http://${storage.containerName}\n`);
            return;
        }

        await container.start();

        this.processService.write(`Storage "${storage.name}" started at http://${storage.containerName}\n`);

        if(storage.style === StorageStyle.PATH) {
            this.processService.write(`Console "${storage.name}" started at http://console.${storage.containerName}\n`);
        }

        this.processService.write(`${colors.green("Don't forget to add these lines into hosts file:")}\n`);

        const domains = [
            storage.containerName,
            ...storage.style === StorageStyle.SUBDOMAIN ? storage.aliases : []
        ];

        for(const domain of domains) {
            this.processService.write(`${colors.gray(`127.0.0.1 ${domain}`)}\n`);
        }
    }

    public async createBucket(storage: Storage, bucket: string) {
        await this.dockerService.exec(
            storage.containerName,
            ["mc", "alias", "set", storage.name, `http://${storage.containerName}`, storage.username, storage.password],
            true
        );

        await this.dockerService.exec(
            storage.containerName,
            ["mc", "mb", `${storage.name}/${bucket}`],
            true
        );

        return true;
    }

    public async deleteBucket(storage: Storage, bucket: string, force?: boolean) {
        await this.dockerService.exec(
            storage.containerName,
            ["mc", "alias", "set", storage.name, `http://${storage.containerName}`, storage.username, storage.password],
            true
        );

        await this.dockerService.exec(
            storage.containerName,
            ["mc", "rb", ...force ? ["--force"] : [], `${storage.name}/${bucket}`],
            true
        );

        return true;
    }
}
