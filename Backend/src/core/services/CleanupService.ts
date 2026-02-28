import { IVideoRepository } from '../interfaces/IVideoRepository';
import { IStorageService } from '../interfaces/IStorageService';
import { logger } from '../utils/logger';

export class CleanupService {
    constructor(
        private videoRepo: IVideoRepository,
        private storageService: IStorageService
    ) { }

    async cleanupStaleUploads() {
        logger.info('[CleanupService] Starting cleanup job...');

        const policies = [
            { status: 'INITIATED' as const, ttlRequests: 24 * 60 * 60 * 1000 },
            { status: 'UPLOADING' as const, ttlRequests: 24 * 60 * 60 * 1000 },
            { status: 'COMPLETING' as const, ttlRequests: 15 * 60 * 1000 }
        ];

        const now = new Date();

        for (const policy of policies) {
            try {
                const olderThan = new Date(now.getTime() - policy.ttlRequests);
                logger.info(`[CleanupService] Checking for ${policy.status} uploads older than ${olderThan.toISOString()}`);

                const staleJobs = await this.videoRepo.findStaleUploads({
                    status: policy.status,
                    olderThan: olderThan
                });

                logger.info(`[CleanupService] Found ${staleJobs.length} stale ${policy.status} uploads.`);

                for (const job of staleJobs) {
                    await this.processStaleJob(job.videoId, job.s3Key, job.uploadId);
                }

            } catch (err) {
                logger.error({ err }, `[CleanupService] Error processing policy ${policy.status}`);
            }
        }

        logger.info('[CleanupService] Cleanup job finished.');
    }

    private async processStaleJob(videoId: string, s3Key: string, uploadId: string) {
        try {
            logger.info({ videoId }, '[CleanupService] Aborting upload for video');

            // 1. Abort S3 Multipart Upload
            // This is idempotent, so it's safe to call even if already aborted.
            await this.storageService.abortMultipartUpload(s3Key, uploadId);

            // 2. Mark DB as FAILED
            await this.videoRepo.markAsFailed(videoId, 'EXPIRED');

            logger.info({ videoId }, '[CleanupService] Successfully cleaned up video');

        } catch (err) {
            logger.error({ err, videoId }, '[CleanupService] Failed to cleanup video');
        }
    }
}
