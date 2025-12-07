
import { Request, Response } from 'express';
import { VideoModel } from '../models/VideoModel';
import { S3StorageService } from '../services/S3StorageService';

const s3Service = new S3StorageService();

export class VideoController {

    static async getUserVideos(req: Request, res: Response) {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: "userId required" });
            }

            const videos = await VideoModel.find({ userId }).sort({ createdAt: -1 });
            return res.json({ videos });
        } catch (error) {
            console.error("Get Videos Error:", error);
            return res.status(500).json({ error: "Failed to fetch videos" });
        }
    }

    static async getVideo(req: Request, res: Response) {
        try {
            const { videoId } = req.params;

            const video = await VideoModel.findOne({ videoId });

            if (!video) {
                return res.status(404).json({ error: "Video not found" });
            }

            let url = null;
            if (video.s3Key) {
                try {
                    url = await s3Service.generatePresignedDownloadUrl(video.s3Key);
                } catch (e) {
                    console.error("Failed to sign url", e);
                }
            }

            return res.json({ video: { ...video.toObject(), url } });
        } catch (error) {
            console.error("Get Video Error:", error);
            return res.status(500).json({ error: "Failed to fetch video" });
        }
    }
}
