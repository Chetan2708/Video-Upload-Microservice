
import { Request, Response, NextFunction } from 'express';
import { IStorageService } from '../../core/interfaces/IStorageService';
import { IVideoRepository } from '../../core/interfaces/IVideoRepository';
import { NotFoundError, ConflictError, AppError } from '../../core/errors/AppError';

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
                parts: {}
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

    confirmPart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId, partNumber, etag } = req.body;

            // Simple existence check (optional optimization, repo handles it too)
            const video = await this.videoRepo.findById(videoId);
            if (!video) {
                throw new NotFoundError("Video not found");
            }

            // Delegating strict idempotency and failure analysis to Repo
            await this.videoRepo.addPart(videoId, { PartNumber: partNumber, ETag: etag });

            return res.json({ message: "Part confirmed" });

        } catch (error) {
            next(error);
        }
    }

    completeUpload = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.body;
            let video = await this.videoRepo.findById(videoId);

            if (!video) {
                throw new NotFoundError("Video not found");
            }

            if (video.status === 'UPLOADED') {
                return res.json({ message: "Upload complete", status: 'UPLOADED' });
            }

            if (video.status === 'COMPLETING') {
                if (video.completionParts?.length) {
                    await this.videoRepo.finalizeUpload(videoId);
                    return res.json({ message: "Upload complete", status: 'UPLOADED' });
                }
                return res.status(202).json({ message: "Completion in progress" });
            }

            if (video.status === 'UPLOADING') {
                const lockedVideo = await this.videoRepo.tryAcquireCompletionLock(videoId);

                if (!lockedVideo) {
                    // Race condition hit: Someone else likely locked it. Check state again.
                    const freshVideo = await this.videoRepo.findById(videoId);
                    if (freshVideo?.status === 'UPLOADED') return res.json({ message: "Upload complete", status: 'UPLOADED' });
                    if (freshVideo?.status === 'COMPLETING') return res.status(202).json({ message: "Completion in progress" });
                    // Should not really happen if logic is correct, but fail safe
                    throw new ConflictError("Concurrent completion in progress");
                }

                // Lock Acquired. We own the transition.
                // Phase 1: Snapshot
                const partsMap = lockedVideo.parts || {};
                const partsArray = Object.entries(partsMap).map(([partNum, partData]) => ({
                    PartNumber: Number(partNum),
                    ETag: partData.etag
                })).sort((a, b) => a.PartNumber - b.PartNumber);

                if (partsArray.length === 0) {
                    // TODO: Rollback lock? For now just throw
                    throw new AppError("No parts found", 400);
                }

                await this.videoRepo.persistCompletionSnapshot(videoId, partsArray);

                // Phase 2: Execute
                await this.s3Service.completeMultipartUpload(lockedVideo.s3Key, lockedVideo.uploadId, partsArray);
                await this.videoRepo.finalizeUpload(videoId);

                return res.json({ message: "Upload complete", status: 'UPLOADED' });
            }

            throw new ConflictError(`Cannot complete upload in status ${video.status}`);

        } catch (error) {
            next(error);
        }
    }
}
