
import { Request, Response } from 'express';
import { IVideoRepository } from '../../core/interfaces/IVideoRepository';
import { IStorageService } from '../../core/interfaces/IStorageService';

export class VideoController {
    constructor(
        private videoRepo: IVideoRepository,
        private s3Service: IStorageService
    ) { }

    getUserVideos = async (req: Request, res: Response) => {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: "userId required" });
            }

            const videos = await this.videoRepo.findByUserId(userId as string);
            return res.json({ videos });
        } catch (error) {
            console.error("Get Videos Error:", error);
            return res.status(500).json({ error: "Failed to fetch videos" });
        }
    }

    getVideo = async (req: Request, res: Response) => {
        try {
            const { videoId } = req.params;

            const video = await this.videoRepo.findById(videoId);

            if (!video) {
                return res.status(404).json({ error: "Video not found" });
            }

            let url = null;
            if (video.s3Key) {
                try {
                    url = await this.s3Service.generatePresignedDownloadUrl(video.s3Key);
                } catch (e) {
                    console.error("Failed to sign url", e);
                }
            }

            return res.json({ video: { ...video, url } });
        } catch (error) {
            console.error("Get Video Error:", error);
            return res.status(500).json({ error: "Failed to fetch video" });
        }
    }
}
