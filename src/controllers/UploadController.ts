
import { Request, Response } from 'express';
import { S3StorageService } from '../services/S3StorageService';
import { VideoModel } from '../models/VideoModel';

const s3Service = new S3StorageService();

export class UploadController {

    static async initializeUpload(req: Request, res: Response) {
        try {
            const { fileName, contentType } = req.body;

            if (!fileName || !contentType) {
                return res.status(400).json({ error: "FileName and ContentType required" });
            }

            const { uploadId, key } = await s3Service.initiateMultipartUpload(fileName, contentType);

            return res.json({ uploadId, key });
        } catch (error) {
            console.error("Init Upload Error:", error);
            return res.status(500).json({ error: "Failed to init upload" });
        }
    }

    static async signPart(req: Request, res: Response) {
        try {
            const { key, uploadId, partNumber } = req.body;

            const url = await s3Service.generatePresignedUrl(key, uploadId, Number(partNumber));
            return res.json({ url });
        } catch (error) {
            console.error("Sign Part Error:", error);
            return res.status(500).json({ error: "Failed to sign part" });
        }
    }

    static async completeUpload(req: Request, res: Response) {
        try {
            const { key, uploadId, parts, fileName, contentType, fileSize, userId } = req.body;

            // 1. Complete S3 Upload
            await s3Service.completeMultipartUpload(key, uploadId, parts);

            // 2. Create Video Record in DB
            const video = await VideoModel.create({
                userId, // Passed from client
                fileName: fileName,
                contentType: contentType || 'video/mp4',
                fileSize: Number(fileSize),
                uploadId,
                s3Key: key,
                status: 'uploaded',
                processedFiles: []
            });

            return res.json({ message: "Upload complete", videoId: video.videoId });

        } catch (error) {
            console.error("Complete Upload Error:", error);
            return res.status(500).json({ error: "Failed to complete upload" });
        }
    }
}
