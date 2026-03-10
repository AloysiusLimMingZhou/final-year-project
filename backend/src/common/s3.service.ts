import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly region: string;

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.getOrThrow('AWS_BUCKET_NAME')
        this.region = this.configService.getOrThrow('AWS_S3_REGION')
        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY')
            }
        })
    }

    async uploadFile(fileName: string, fileContent: Buffer) {
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: fileContent,
                ContentType: 'application/pdf'
            })
        )

        return fileName;
    }

    async getPresignedURL(fileName: string) {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: fileName
        })

        const url = await getSignedUrl(this.s3Client, command, { expiresIn: 60 * 30 })
        return url;
    }
}