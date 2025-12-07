
import { Router } from 'express';
import { UploadController } from '../interface-adapters/controllers/UploadController';
import { VideoController } from '../interface-adapters/controllers/VideoController';

const router = Router();

// Upload Routes
router.post('/upload/init', UploadController.initializeUpload);
router.post('/upload/sign-part', UploadController.signPart);
router.post('/upload/complete', UploadController.completeUpload);

// Video Routes
router.get('/videos', VideoController.getUserVideos);
router.get('/videos/:videoId', VideoController.getVideo);

export default router;
