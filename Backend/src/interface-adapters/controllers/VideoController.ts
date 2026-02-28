import { Request, Response, NextFunction } from 'express';
import { VideoService } from '../../core/services/VideoService';

export class VideoController {
    constructor(
        private videoService: VideoService
    ) { }

    getUserVideos = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.query;

            if (!userId) {
                res.status(400).json({ error: "userId required" });
                return;
            }

            const videos = await this.videoService.getUserVideos(userId as string);
            res.json({ videos });
        } catch (error) {
            next(error);
        }
    }

    getVideo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.params;

            const video = await this.videoService.getVideoWithPresignedUrl(videoId);
            res.json({ video });
        } catch (error) {
            next(error);
        }
    }

    getVideoStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.params;

            const status = await this.videoService.getVideoStatus(videoId);
            res.json({ status });
        } catch (error) {
            next(error);
        }
    }
}
