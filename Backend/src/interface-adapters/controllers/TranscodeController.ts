import { Request, Response, NextFunction } from 'express';
import { TranscodeService } from '../../core/services/TranscodeService';

export class TranscodeController {
    constructor(
        private transcodeService: TranscodeService
    ) {}

    /**
     * POST /videos/:videoId/transcode
     * Manually trigger (or re-trigger) transcoding for an uploaded video.
     */
    triggerTranscode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.params;

            if (!this.transcodeService.isEnabled()) {
                res.status(503).json({
                    error: 'Transcoding is not configured. Set AWS_MEDIACONVERT_ENDPOINT and AWS_MEDIACONVERT_ROLE_ARN.',
                });
                return;
            }

            const result = await this.transcodeService.submitTranscode(videoId);

            if (!result) {
                res.json({ message: 'Transcoding skipped or already complete', videoId });
                return;
            }

            res.status(202).json({
                message: 'Transcoding job submitted',
                videoId,
                jobId: result.jobId,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /videos/:videoId/transcode
     * Check the current transcoding status and progress.
     */
    getTranscodeStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.params;

            const status = await this.transcodeService.getTranscodeStatus(videoId);
            res.json(status);
        } catch (error) {
            next(error);
        }
    }
}
