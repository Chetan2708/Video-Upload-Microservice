
import { Request, Response, NextFunction } from 'express';
import { IStorageService } from '../../core/interfaces/IStorageService';
import { IVideoRepository } from '../../core/interfaces/IVideoRepository';
import { NotFoundError, ConflictError, AppError } from '../../core/errors/AppError';

export class UploadController {
    constructor(
        private s3Service: IStorageService,
        private videoRepo: IVideoRepository
    ) { }

    initializeUpload = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { fileName, contentType, fileSize } = req.body;
            // @ts-ignore
            const userId = req.user!.id;

            if (!fileName || !contentType || !fileSize) {
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
            next(error);
        }
    }

    signPart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId, partNumber } = req.body;
            // @ts-ignore
            const userId = req.user!.id;

            const video = await this.videoRepo.findByIdAndUser(videoId, userId);
            if (!video) {
                return res.status(404).json({ error: "Video not found" });
            }

            if (video.status !== 'INITIATED' && video.status !== 'UPLOADING') {
                return res.status(409).json({ error: `Cannot sign part in status ${video.status}` });
            }

            const url = await this.s3Service.generatePresignedUrl(video.s3Key, video.uploadId, Number(partNumber));
            return res.json({ url });
        } catch (error) {
            next(error);
        }
    }

    confirmPart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId, partNumber, etag } = req.body;
            // @ts-ignore
            const userId = req.user!.id;

            await this.videoRepo.addPart(videoId, userId, { PartNumber: partNumber, ETag: etag });

            return res.json({ message: "Part confirmed" });

        } catch (error) {
            next(error);
        }
    }

    completeUpload = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.body;
            // @ts-ignore
            const userId = req.user!.id;

            let video = await this.videoRepo.findByIdAndUser(videoId, userId);

            if (!video) {
                throw new NotFoundError("Video not found");
            }

            if (video.status === 'UPLOADED') {
                return res.json({ message: "Upload complete", status: 'UPLOADED' });
            }

            if (video.status === 'COMPLETING') {
                if (video.completionParts && video.completionParts.length > 0) {
                    await this.videoRepo.finalizeUpload(videoId, userId);
                    return res.json({ message: "Upload complete", status: 'UPLOADED' });
                }
                return res.status(202).json({ message: "Completion in progress" });
            }

            // 3. Active Path: Attempt to Lock
            if (video.status === 'UPLOADING') {
                //FIND ONE AND UPDATE --> THE LOCK !
                const lockedVideo = await this.videoRepo.tryAcquireCompletionLock(videoId, userId);

                if (!lockedVideo) {
                    // Race condition hit: Someone else likely locked it. Check state again.
                    const freshVideo = await this.videoRepo.findByIdAndUser(videoId, userId);
                    if (freshVideo?.status === 'UPLOADED') return res.json({ message: "Upload complete", status: 'UPLOADED' });
                    if (freshVideo?.status === 'COMPLETING') return res.status(202).json({ message: "Completion in progress" });
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

                await this.videoRepo.persistCompletionSnapshot(videoId, userId, partsArray);

                // Phase 2: Execute
                await this.s3Service.completeMultipartUpload(lockedVideo.s3Key, lockedVideo.uploadId, partsArray);
                await this.videoRepo.finalizeUpload(videoId, userId);
                return res.json({ message: "Upload complete", status: 'UPLOADED' });
            }

            throw new ConflictError(`Cannot complete upload in status ${video.status}`);

        } catch (error) {
            next(error);
        }
    }
}
