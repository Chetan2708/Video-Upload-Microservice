import { IVideoRepository } from '../interfaces/IVideoRepository';
import { IStorageService } from '../interfaces/IStorageService';

export class CleanupService {
    constructor(
        private videoRepo: IVideoRepository,
        private storageService: IStorageService
    ) { }

    async cleanupStaleUploads() {
        console.log('[CleanupService] Starting cleanup job...');

        const policies = [
            { status: 'INITIATED' as const, ttlRequests: 24 * 60 * 60 * 1000 },
            { status: 'UPLOADING' as const, ttlRequests: 24 * 60 * 60 * 1000 },
            { status: 'COMPLETING' as const, ttlRequests: 15 * 60 * 1000 }
        ];

        const now = new Date();

        for (const policy of policies) {
            try {
                const olderThan = new Date(now.getTime() - policy.ttlRequests);
                console.log(`[CleanupService] Checking for ${policy.status} uploads older than ${olderThan.toISOString()}`);

                const staleJobs = await this.videoRepo.findStaleUploads({
                    status: policy.status,
                    olderThan: olderThan
                });

                console.log(`[CleanupService] Found ${staleJobs.length} stale ${policy.status} uploads.`);

                for (const job of staleJobs) {
                    await this.processStaleJob(job.videoId, job.s3Key, job.uploadId);
                }

            } catch (err) {
                console.error(`[CleanupService] Error processing policy ${policy.status}:`, err);
            }
        }

        console.log('[CleanupService] Cleanup job finished.');
    }

    private async processStaleJob(videoId: string, s3Key: string, uploadId: string) {
        try {
            console.log(`[CleanupService] Aborting upload for videoId=${videoId}`);

            // 1. Abort S3 Multipart Upload
            // This is idempotent, so it's safe to call even if already aborted.
            await this.storageService.abortMultipartUpload(s3Key, uploadId);

            // 2. Mark DB as FAILED
            await this.videoRepo.markAsFailed(videoId, 'EXPIRED');

            console.log(`[CleanupService] Successfully cleaned up videoId=${videoId}`);

        } catch (err) {
            console.error(`[CleanupService] Failed to cleanup videoId=${videoId}`, err);
        }
    }
}
