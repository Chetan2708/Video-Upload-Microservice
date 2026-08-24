import { Request, Response, NextFunction } from 'express';
import { VideoService } from '../../core/services/VideoService';

export class VideoController {
    constructor(
        private videoService: VideoService
    ) { }

    getUserVideos = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id || req.query.userId;

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

    getVideosBulk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoIds } = req.body;
            
            if (!Array.isArray(videoIds)) {
                res.status(400).json({ error: "videoIds must be an array" });
                return;
            }

            const videos = await this.videoService.getVideosBulk(videoIds);
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
