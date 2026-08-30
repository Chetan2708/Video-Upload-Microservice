import { IStorageService } from '../interfaces/IStorageService';
import { IVideoRepository, IVideoJob } from '../interfaces/IVideoRepository';
import { NotFoundError, ConflictError, AppError } from '../errors/AppError';
import { TranscodeService } from './TranscodeService';
import { logger } from '../utils/logger';

export class UploadService {
    constructor(
        private s3Service: IStorageService,
        private videoRepo: IVideoRepository,
        private transcodeService?: TranscodeService
    ) { }

    async initializeUpload(fileName: string, contentType: string, fileSize: number, userId: string): Promise<{ videoId: string; uploadId: string; key: string; }> {
        logger.info({ userId, fileName }, 'Initializing upload');
        const { uploadId, key } = await this.s3Service.initiateMultipartUpload(fileName, contentType);

        const video = await this.videoRepo.create({
            userId,
            fileName,
            contentType,
            fileSize,
            uploadId,
            s3Key: key,
            status: 'INITIATED',
            processedFiles: [],
            parts: {}
        });

        logger.info({ videoId: video.videoId }, 'Upload initialized successfully');
        return {
            videoId: video.videoId,
            uploadId,
            key
        };
    }

    async signPart(videoId: string, userId: string, partNumber: number): Promise<string> {
        logger.info({ videoId, userId, partNumber }, 'Signing part');
        const video = await this.videoRepo.findByIdAndUser(videoId, userId);
        if (!video) {
            throw new NotFoundError("Video not found");
        }

        if (video.status !== 'INITIATED' && video.status !== 'UPLOADING') {
            throw new ConflictError(`Cannot sign part in status ${video.status}`);
        }

        const url = await this.s3Service.generatePresignedUrl(video.s3Key, video.uploadId, partNumber);
        return url;
    }

    async confirmPart(videoId: string, userId: string, partNumber: number, etag: string): Promise<void> {
        logger.info({ videoId, userId, partNumber }, 'Confirming part');
        await this.videoRepo.addPart(videoId, userId, { PartNumber: partNumber, ETag: etag });
    }

    async completeUpload(videoId: string, userId: string): Promise<{ message: string; status: string; }> {
        logger.info({ videoId, userId }, 'Attempting to complete upload');
        let video = await this.videoRepo.findByIdAndUser(videoId, userId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        if (video.status === 'UPLOADED') {
            return { message: "Upload complete", status: 'UPLOADED' };
        }

        if (video.status === 'COMPLETING') {
            if (video.completionParts && video.completionParts.length > 0) {
                await this.videoRepo.finalizeUpload(videoId, userId);
                return { message: "Upload complete", status: 'UPLOADED' };
            }
            return { message: "Completion in progress", status: 'COMPLETING' };
        }

        if (video.status === 'UPLOADING') {
            const lockedVideo = await this.videoRepo.tryAcquireCompletionLock(videoId, userId);

            if (!lockedVideo) {
                // Race condition hit: Someone else likely locked it. Check state again.
                const freshVideo = await this.videoRepo.findByIdAndUser(videoId, userId);
                if (freshVideo?.status === 'UPLOADED') return { message: "Upload complete", status: 'UPLOADED' };
                if (freshVideo?.status === 'COMPLETING') return { message: "Completion in progress", status: 'COMPLETING' };
                throw new ConflictError("Concurrent completion in progress");
            }

            // Lock Acquired. We own the transition.
            const partsMap = lockedVideo.parts || {};
            const partsArray = Object.entries(partsMap).map(([partNum, partData]) => ({
                PartNumber: Number(partNum),
                ETag: (partData as any).etag
            })).sort((a, b) => a.PartNumber - b.PartNumber);

            if (partsArray.length === 0) {
                throw new AppError("No parts found", 400);
            }

            await this.videoRepo.persistCompletionSnapshot(videoId, userId, partsArray);

            logger.info({ videoId }, 'Sending complete multipart upload to S3');
            await this.s3Service.completeMultipartUpload(lockedVideo.s3Key, lockedVideo.uploadId, partsArray);
            await this.videoRepo.finalizeUpload(videoId, userId);

            logger.info({ videoId }, 'Successfully completed upload');

            return { message: "Upload complete", status: 'UPLOADED' };
        }

        throw new ConflictError(`Cannot complete upload in status ${video.status}`);
    }

    async abortUpload(videoId: string, userId: string): Promise<void> {
        logger.info({ videoId, userId }, 'Aborting upload');
        const video = await this.videoRepo.findByIdAndUser(videoId, userId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        if (video.status === 'UPLOADED') {
            throw new ConflictError("Cannot abort an already uploaded video");
        }

        if (video.uploadId && video.s3Key) {
            try {
                await this.s3Service.abortMultipartUpload(video.s3Key, video.uploadId);
            } catch (err) {
                logger.error({ err, videoId }, 'Failed to abort multipart upload in S3, continuing with DB update');
            }
        }

        await this.videoRepo.markAsFailed(videoId, 'USER_ABORTED');
        logger.info({ videoId }, 'Successfully aborted upload');
    }

    /**
     * Fire-and-forget transcoding trigger.
     * Errors are logged but never propagated — the upload is already complete.
     */
    private triggerTranscodeAsync(videoId: string): void {
        if (!this.transcodeService?.isEnabled()) {
            return;
        }

        this.transcodeService.submitTranscode(videoId).catch((err) => {
            logger.error({ err, videoId }, 'Auto-trigger transcoding failed (non-blocking)');
        });
    }
}
