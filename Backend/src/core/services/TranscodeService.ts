import { ITranscodeService } from '../interfaces/ITranscodeService';
import { IVideoRepository } from '../interfaces/IVideoRepository';
import { NotFoundError, ConflictError, UnauthorizedError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { UserModel } from '../../infrastructure/database/models/UserModel';

/**
 * Orchestrates the video transcoding lifecycle.
 *
 * Responsibilities:
 *  - Submit transcoding jobs for uploaded videos
 *  - Poll active jobs and transition video status accordingly
 *  - Provide transcode status to controllers
 *
 * This service depends only on interfaces, not on AWS SDK classes directly.
 */
export class TranscodeService {
    constructor(
        private transcodeProvider: ITranscodeService,
        private videoRepo: IVideoRepository
    ) {}

    /**
     * Whether the transcoding subsystem is configured and available.
     */
    isEnabled(): boolean {
        return this.transcodeProvider.isEnabled();
    }

    /**
     * Submit a transcoding job for a video that has finished uploading.
     *
     * Transitions: UPLOADED → PROCESSING
     *
     * Idempotent: if the video is already PROCESSING or DONE, this is a no-op.
     */
    async submitTranscode(videoId: string): Promise<{ jobId: string } | null> {
        if (!this.transcodeProvider.isEnabled()) {
            logger.info({ videoId }, 'Transcoding disabled — skipping');
            return null;
        }

        const video = await this.videoRepo.findById(videoId);

        if (!video) {
            throw new NotFoundError('Video not found');
        }

        // Idempotent: already processing or done
        if (video.status === 'PROCESSING' || video.status === 'DONE') {
            logger.info({ videoId, status: video.status }, 'Video already processing or done');
            return video.transcodeJobId ? { jobId: video.transcodeJobId } : null;
        }

        if (video.status !== 'UPLOADED') {
            throw new ConflictError(`Cannot transcode video in status ${video.status}`);
        }

        const user = await UserModel.findById(video.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        if (user.credits < 1) {
            throw new UnauthorizedError('Insufficient credits for transcoding');
        }

        // Deduct 1 credit
        user.credits -= 1;
        await user.save();

        // Submit to MediaConvert
        const { jobId } = await this.transcodeProvider.submitJob(
            video.videoId,
            video.s3Key,
            video.contentType
        );

        // Transition to PROCESSING
        const updated = await this.videoRepo.startProcessing(videoId, jobId);
        if (!updated) {
            // Race condition: another request transitioned the status first
            logger.warn({ videoId }, 'startProcessing returned false — likely a concurrent transition');
            return { jobId };
        }

        logger.info({ videoId, jobId }, 'Transcoding submitted and video moved to PROCESSING');
        return { jobId };
    }

    /**
     * Check the transcode status for a specific video.
     */
    async getTranscodeStatus(videoId: string) {
        const video = await this.videoRepo.findById(videoId);
        if (!video) {
            throw new NotFoundError('Video not found');
        }

        if (!video.transcodeJobId) {
            return {
                videoId,
                status: video.status,
                transcodeStatus: null,
                message: 'No transcoding job associated with this video',
            };
        }

        const jobDetails = await this.transcodeProvider.getJobStatus(video.transcodeJobId);

        return {
            videoId,
            status: video.status,
            transcodeJobId: video.transcodeJobId,
            transcodeStatus: jobDetails.status,
            percentComplete: jobDetails.percentComplete,
            outputFiles: jobDetails.outputFiles,
            errorMessage: jobDetails.errorMessage,
        };
    }

    /**
     * Poll all videos in PROCESSING status and reconcile with MediaConvert job state.
     *
     * This is designed to be called by a cron job. It's safe to call concurrently
     * (MongoDB atomic updates prevent double-transitions).
     */
    async pollActiveJobs(): Promise<void> {
        if (!this.transcodeProvider.isEnabled()) {
            return;
        }

        const processingVideos = await this.videoRepo.findByStatus('PROCESSING');

        if (processingVideos.length === 0) {
            return;
        }

        logger.debug({ count: processingVideos.length }, 'Polling active transcode jobs');

        for (const video of processingVideos) {
            if (!video.transcodeJobId) {
                logger.warn({ videoId: video.videoId }, 'PROCESSING video has no transcodeJobId — marking failed');
                await this.videoRepo.markAsFailed(video.videoId, 'MISSING_TRANSCODE_JOB_ID');
                continue;
            }

            try {
                const jobDetails = await this.transcodeProvider.getJobStatus(video.transcodeJobId);

                switch (jobDetails.status) {
                    case 'COMPLETE': {
                        logger.info({ videoId: video.videoId, outputFiles: jobDetails.outputFiles }, 'Transcode complete');
                        await this.videoRepo.completeProcessing(video.videoId, jobDetails.outputFiles);
                        break;
                    }

                    case 'ERROR': {
                        const reason = jobDetails.errorMessage || 'MediaConvert job failed';
                        logger.error({ videoId: video.videoId, reason }, 'Transcode failed');
                        await this.videoRepo.markAsFailed(video.videoId, reason);
                        break;
                    }

                    case 'CANCELED': {
                        logger.warn({ videoId: video.videoId }, 'Transcode job was canceled');
                        await this.videoRepo.markAsFailed(video.videoId, 'TRANSCODE_CANCELED');
                        break;
                    }

                    case 'PROGRESSING':
                    case 'SUBMITTED':
                        // Still in progress — nothing to do
                        logger.debug({
                            videoId: video.videoId,
                            percent: jobDetails.percentComplete
                        }, 'Transcode still in progress');
                        break;
                }
            } catch (err) {
                // Don't let one failed poll break the entire loop
                logger.error({ err, videoId: video.videoId }, 'Error polling transcode job status');
            }
        }
    }
}
