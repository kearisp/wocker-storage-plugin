import {
    Injectable,
    PluginConfigService,
    ProxyService,
    DockerService,
    ProcessService
} from "@wocker/core";
import colors from "yoctocolors-cjs";
import {Storage} from "../makes/Storage";
import {StorageProvider} from "../types/StorageProvider";
import {StorageStyle} from "../types/StorageStyle";


@Injectable()
export class SeaweedfsProvider extends StorageProvider {
    public constructor(
        protected readonly processService: ProcessService,
        protected readonly proxyService: ProxyService,
        protected readonly dockerService: DockerService,
        protected readonly pluginConfigService: PluginConfigService
    ) {
        super();
    }

    protected identitiesFileName(storage: Storage): string {
        return `${storage.name}.s3-identities.json`;
    }

    protected writeIdentities(storage: Storage): void {
        this.pluginConfigService.fs.writeJSON(this.identitiesFileName(storage), {
            identities: [
                {
                    name: storage.username,
                    credentials: [
                        {
                            accessKey: storage.username,
                            secretKey: storage.password
                        }
                    ],
                    actions: ["Admin", "Read", "Write"]
                }
            ]
        });
    }

    public async start(storage: Storage, restart?: boolean) {
        if(restart) {
            await this.dockerService.removeContainer(storage.containerName);
        }

        let container = await this.dockerService.getContainer(storage.containerName);

        if(!container) {
            this.writeIdentities(storage);

            container = await this.dockerService.createContainer({
                cmd: ["server", "-dir=/data", "-ip.bind=0.0.0.0", "-filer=true", "-s3", "-s3.config=/etc/seaweedfs/s3.json"],
                name: storage.containerName,
                image: storage.image,
                aliases: storage.aliases,
                restart: "always",
                internal: true,
                env: {
                    VIRTUAL_HOST_MULTIPORTS: JSON.stringify(
                        storage.style === StorageStyle.PATH ? {
                            [storage.containerName]: {
                                "/": {
                                    port: 8333
                                }
                            },
                            [`console.${storage.containerName}`]: {
                                "/": {
                                    port: 8888
                                }
                            }
                        } : storage.aliases.reduce((res, subdomain) => {
                            return {
                                ...res,
                                [subdomain]: {
                                    "/": {
                                        port: 8333
                                    }
                                }
                            };
                        }, {
                            [storage.containerName]: {
                                "/": {
                                    port: 8888
                                }
                            }
                        })
                    )
                },
                volumes: [
                    `${storage.volume}:/data`,
                    `${this.pluginConfigService.fs.path(this.identitiesFileName(storage))}:/etc/seaweedfs/s3.json:ro`
                ]
            });
        }

        const {
            State: {
                Running
            }
        } = await container.inspect();

        await this.proxyService.start();

        const storageUrls = storage.style === StorageStyle.PATH
            ? [`http://${storage.containerName}`]
            : storage.bucketUrls;

        if(Running) {
            this.processService.write(`Storage "${storage.name}" is already running${storageUrls.length > 0 ? ":" : ""}\n`);

            for(const url of storageUrls) {
                this.processService.write(`  ${url}\n`);
            }

            this.processService.write(`Console "${storage.name}" is running at ${storage.consoleUrl}\n`);
            return;
        }

        await container.start();

        if(storageUrls.length > 0) {
            this.processService.write(`Storage "${storage.name}" started:\n`);

            for(const url of storageUrls) {
                this.processService.write(`  ${url}\n`);
            }
        }
        else {
            this.processService.write(`Storage "${storage.name}" started. Create a bucket (storage:create-bucket) to get an S3 endpoint.\n`);
        }

        this.processService.write(`Console "${storage.name}" started at ${storage.consoleUrl}\n`);

        this.processService.write(`${colors.green("Don't forget to add these lines into hosts file:")}\n`);

        for(const domain of storage.domains) {
            this.processService.write(`${colors.gray(`127.0.0.1 ${domain}`)}\n`);
        }
    }

    public async createBucket(storage: Storage, bucket: string) {
        await this.dockerService.exec(
            storage.containerName,
            ["weed", "shell", "-c", `s3.bucket.create -name ${bucket}`],
            true
        );

        return true;
    }

    public async deleteBucket(storage: Storage, bucket: string, force?: boolean) {
        await this.dockerService.exec(
            storage.containerName,
            force
                ? ["weed", "shell", "-c", `fs.rm -r /buckets/${bucket}`]
                : ["weed", "shell", "-c", `s3.bucket.delete -name ${bucket}`],
            true
        );

        return true;
    }
}
