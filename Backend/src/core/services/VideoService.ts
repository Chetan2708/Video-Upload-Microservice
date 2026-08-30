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

    async getVideosBulk(videoIds: string[]): Promise<IVideoJob[]> {
        logger.info({ count: videoIds.length }, 'Fetching multiple videos by IDs');
        return await this.videoRepo.findByIds(videoIds);
    }

    async getVideoWithPresignedUrl(videoId: string): Promise<IVideoJob & { url: string | null; hlsUrl?: string | null; mp4Url?: string | null }> {
        logger.info({ videoId }, 'Fetching video details');
        const video = await this.videoRepo.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        let url = null;
        let hlsUrl = null;
        let mp4Url = null;

        if (video.s3Key) {
            try {
                url = await this.s3Service.generatePresignedDownloadUrl(video.s3Key);
            } catch (e) {
                logger.error({ videoId, error: e }, "Failed to sign url");
            }
        }

        if (video.status === 'DONE' && video.processedFiles?.length > 0) {
            try {
                // processedFiles contains directory prefixes like "processed-videos/<id>/hls/"
                const hlsPrefix = video.processedFiles.find(prefix => prefix.endsWith('hls/'));
                const mp4Prefix = video.processedFiles.find(prefix => prefix.endsWith('mp4/'));

                if (hlsPrefix) {
                    // MediaConvert automatically prepends the input file's base name when the destination is a folder
                    const baseName = video.s3Key ? video.s3Key.split('/').pop()?.split('.').slice(0, -1).join('.') : '';
                    const hlsKey = `${hlsPrefix}${baseName}_1080p.m3u8`;
                    hlsUrl = await this.s3Service.generatePresignedDownloadUrl(hlsKey);
                }
                if (mp4Prefix) {
                    const baseName = video.s3Key ? video.s3Key.split('/').pop()?.split('.').slice(0, -1).join('.') : '';
                    const mp4Key = `${mp4Prefix}${baseName}_720p.mp4`;
                    mp4Url = await this.s3Service.generatePresignedDownloadUrl(mp4Key);
                }
            } catch (e) {
                logger.error({ videoId, error: e }, "Failed to sign processed urls");
            }
        }

        return { ...video, url, hlsUrl, mp4Url };
    }

    async getVideoStatus(videoId: string): Promise<string> {
        logger.debug({ videoId }, 'Fetching video status');
        const video = await this.videoRepo.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        return video.status;
    }
}
