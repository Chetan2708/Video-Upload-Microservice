
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

/**
 * @swagger
 * /upload/init:
 *   post:
 *     summary: Initialize a multipart upload
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadInitResponse'
 *       400:
 *         description: Invalid input
 */
router.post('/upload/init', validate([
    body('fileName').isString(),
    body('contentType').isString()
]), uploadController.initializeUpload);

/**
 * @swagger
 * /upload/sign-part:
 *   post:
 *     summary: Sign a part for multipart upload
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - uploadId
 *               - partNumber
 *             properties:
 *               key:
 *                 type: string
 *               uploadId:
 *                 type: string
 *               partNumber:
 *                 type: number
 *     responses:
 *       200:
 *         description: Presigned URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 * */
router.post('/upload/sign-part', validate([
    body('key').isString(),
    body('uploadId').isString(),
    body('partNumber').isNumeric()
]), uploadController.signPart);

/**
 * @swagger
 * /upload/complete:
 *   post:
 *     summary: Complete a multipart upload
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - uploadId
 *               - parts
 *             properties:
 *               key:
 *                 type: string
 *               uploadId:
 *                 type: string
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ETag:
 *                       type: string
 *                     PartNumber:
 *                       type: number
 *     responses:
 *       200:
 *         description: Upload completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 */
router.post('/upload/complete', validate([
    body('key').isString(),
    body('uploadId').isString(),
    body('parts').isArray()
]), uploadController.completeUpload);

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos for the user
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 */
router.get('/videos', videoController.getUserVideos);
/**
 * @swagger
 * /videos/{videoId}:
 *   get:
 *     summary: Get a specific video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */
router.get('/videos/:videoId', videoController.getVideo);
/**
 * @swagger
 * /videos/status/{videoId}:
 *   get:
 *     summary: Get video status
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The video ID
 *     responses:
 *       200:
 *         description: Current status of the video
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *       404:
 *         description: Video not found
 */
router.get('/videos/status/:videoId', videoController.getVideoStatus);

export default router;
