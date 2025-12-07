
import { Router } from 'express';
import { UploadController } from '../interface-adapters/controllers/UploadController';
import { VideoController } from '../interface-adapters/controllers/VideoController';
import { S3StorageService } from '../infrastructure/aws/S3StorageService';
import { MongoVideoRepository } from '../infrastructure/repositories/MongoVideoRepository';

const router = Router();

const s3Service = new S3StorageService();
const videoRepo = new MongoVideoRepository();

const uploadController = new UploadController(s3Service, videoRepo);
const videoController = new VideoController(videoRepo, s3Service);

import { body } from 'express-validator';
import { validate } from '../interface-adapters/middleware/validationMiddleware';

router.post('/upload/init', validate([
    body('fileName').isString(),
    body('contentType').isString()
]), uploadController.initializeUpload);

router.post('/upload/sign-part', validate([
    body('key').isString(),
    body('uploadId').isString(),
    body('partNumber').isNumeric()
]), uploadController.signPart);

router.post('/upload/complete', validate([
    body('key').isString(),
    body('uploadId').isString(),
    body('parts').isArray()
]), uploadController.completeUpload);

router.get('/videos', videoController.getUserVideos);
router.get('/videos/:videoId', videoController.getVideo);

export default router;
