import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../../core/services/UploadService';

export class UploadController {
    constructor(
        private uploadService: UploadService
    ) { }

    initializeUpload = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { fileName, contentType, fileSize } = req.body;
            const userId = req.user!.id;

            if (!fileName || !contentType || !fileSize) {
                res.status(400).json({ error: "Missing required fields" });
                return;
            }

            const result = await this.uploadService.initializeUpload(fileName, contentType, Number(fileSize), userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    signPart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId, partNumber } = req.body;
            const userId = req.user!.id;

            const url = await this.uploadService.signPart(videoId, userId, Number(partNumber));
            res.json({ url });
        } catch (error) {
            next(error);
        }
    }

    confirmPart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId, partNumber, etag } = req.body;
            const userId = req.user!.id;

            await this.uploadService.confirmPart(videoId, userId, Number(partNumber), etag);
            res.json({ message: "Part confirmed" });
        } catch (error) {
            next(error);
        }
    }

    completeUpload = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.body;
            const userId = req.user!.id;

            const result = await this.uploadService.completeUpload(videoId, userId);

            if (result.status === 'COMPLETING') {
                res.status(202).json(result);
                return;
            }

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
