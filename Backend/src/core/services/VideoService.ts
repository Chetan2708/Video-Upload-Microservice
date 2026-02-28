import { IVideoRepository, IVideoJob } from '../interfaces/IVideoRepository';
import { IStorageService } from '../interfaces/IStorageService';
import { NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class VideoService {
    constructor(
        private videoRepo: IVideoRepository,
        private s3Service: IStorageService
    ) { }

    async getUserVideos(userId: string): Promise<IVideoJob[]> {
        logger.info({ userId }, 'Fetching user videos');
        return await this.videoRepo.findByUserId(userId);
    }

    async getVideoWithPresignedUrl(videoId: string): Promise<IVideoJob & { url: string | null }> {
        logger.info({ videoId }, 'Fetching video details');
        const video = await this.videoRepo.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        let url = null;
        if (video.s3Key) {
            try {
                url = await this.s3Service.generatePresignedDownloadUrl(video.s3Key);
            } catch (e) {
                logger.error({ videoId, error: e }, "Failed to sign url");
            }
        }

        return { ...video, url };
    }

    async getVideoStatus(videoId: string): Promise<string> {
        logger.info({ videoId }, 'Fetching video status');
        const video = await this.videoRepo.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        return video.status;
    }
}
