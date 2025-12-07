
import {
    S3Client,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export class S3StorageService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
            throw new Error("AWS Configuration missing");
        }

        this.s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });
        this.bucketName = process.env.AWS_BUCKET_NAME;
    }

    async initiateMultipartUpload(fileName: string, contentType: string) {
        const uniqueKey = `raw-videos/${uuidv4()}-${fileName}`;

        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: uniqueKey,
            ContentType: contentType
        });

        const result = await this.s3Client.send(command);

        return {
            uploadId: result.UploadId!,
            key: uniqueKey
        };
    }

    async generatePresignedUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    }

    async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
        const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

        const command = new CompleteMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: sortedParts
            }
        });

        await this.s3Client.send(command);
    }

    async generatePresignedDownloadUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }
}
