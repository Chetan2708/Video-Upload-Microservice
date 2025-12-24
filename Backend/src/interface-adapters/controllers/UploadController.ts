
import { Request, Response } from 'express';
import { IStorageService } from '../../core/interfaces/IStorageService';
import { IVideoRepository } from '../../core/interfaces/IVideoRepository';

export class UploadController {
    constructor(
        private s3Service: IStorageService,
        private videoRepo: IVideoRepository
    ) { }

    initializeUpload = async (req: Request, res: Response) => {
        try {
            const { fileName, contentType, userId, fileSize } = req.body;

            if (!fileName || !contentType || !userId || !fileSize) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const { uploadId, key } = await this.s3Service.initiateMultipartUpload(fileName, contentType);

            const video = await this.videoRepo.create({
                userId,
                fileName,
                contentType,
                fileSize: Number(fileSize),
                uploadId,
                s3Key: key,
                status: 'INITIATED',
                processedFiles: [],
                parts: []
            });

            return res.json({
                videoId: video.videoId,
                uploadId,
                key
            });
        } catch (error) {
            console.error("Init Upload Error:", error);
            return res.status(500).json({ error: "Failed to init upload" });
        }
    }

    signPart = async (req: Request, res: Response) => {
        try {
            const { videoId, partNumber } = req.body;

            const video = await this.videoRepo.findById(videoId);
            if (!video) {
                return res.status(404).json({ error: "Video not found" });
            }

            if (video.status !== 'INITIATED' && video.status !== 'UPLOADING') {
                return res.status(409).json({ error: `Cannot sign part in status ${video.status}` });
            }

            const url = await this.s3Service.generatePresignedUrl(video.s3Key, video.uploadId, Number(partNumber));
            return res.json({ url });
        } catch (error) {
            console.error("Sign Part Error:", error);
            return res.status(500).json({ error: "Failed to sign part" });
        }
    }

    confirmPart = async (req: Request, res: Response) => {
        try {
            const { videoId, partNumber, etag } = req.body;

            const video = await this.videoRepo.findById(videoId);
            if (!video) {
                return res.status(404).json({ error: "Video not found" });
            }

            const partExists = video.parts?.some(p => p.PartNumber === partNumber);
            if (partExists) {
                return res.json({ message: "Part already confirmed" });
            }

            const success = await this.videoRepo.addPart(videoId, { PartNumber: partNumber, ETag: etag });
            if (!success) {
                return res.status(409).json({ error: "Invalid state for part confirmation" });
            }

            return res.json({ message: "Part confirmed" });

        } catch (error) {
            console.error("Confirm Part Error:", error);
            return res.status(500).json({ error: "Failed to confirm part" });
        }
    }

    completeUpload = async (req: Request, res: Response) => {
        try {
            const { videoId } = req.body;

            const video = await this.videoRepo.findById(videoId);
            if (!video) {
                return res.status(404).json({ error: "Video not found" });
            }

            // Explicitly validate status before S3 call, though atomic transition will catch race conditions later
            // This reads slightly stale data but saves an S3 call if already obvious
            if (video.status !== 'UPLOADING') { // Strict check: must have started uploading
                return res.status(409).json({ error: `Cannot complete upload in status ${video.status}` });
            }

            if (!video.parts || video.parts.length === 0) {
                return res.status(400).json({ error: "No parts found for this video" });
            }

            await this.s3Service.completeMultipartUpload(video.s3Key, video.uploadId, video.parts);

            const success = await this.videoRepo.markAsUploaded(videoId);

            if (!success) {
                // S3 completed but DB failed transition? This implies race or state changed.
                // In a real system we might need reconciliation or revert S3??
                // For now, fail request.
                return res.status(409).json({ error: "Failed to transition to UPLOADED status" });
            }

            const result = {
                videoId: video.videoId,
                fileName: video.fileName,
                fileSize: video.fileSize,
                status: 'UPLOADED',
            };

            return res.json({ message: "Upload complete", result });

        } catch (error) {
            console.error("Complete Upload Error:", error);
            return res.status(500).json({ error: "Failed to complete upload" });
        }
    }
}
