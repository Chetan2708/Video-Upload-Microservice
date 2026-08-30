import { IStorageService } from '../interfaces/IStorageService';
import { IVideoRepository } from '../interfaces/IVideoRepository';
import { ITranscodeService } from '../interfaces/ITranscodeService';
import { S3StorageService } from '../../infrastructure/aws/S3StorageService';
import { MediaConvertService } from '../../infrastructure/aws/MediaConvertClient';
import { MongoVideoRepository } from '../../infrastructure/repositories/MongoVideoRepository';
import { CleanupService } from '../services/CleanupService';
import { UploadService } from '../services/UploadService';
import { VideoService } from '../services/VideoService';
import { TranscodeService } from '../services/TranscodeService';
import { UploadController } from '../../interface-adapters/controllers/UploadController';
import { VideoController } from '../../interface-adapters/controllers/VideoController';
import { TranscodeController } from '../../interface-adapters/controllers/TranscodeController';
import { logger } from '../utils/logger';

export class ServiceContainer {
    private static instance: ServiceContainer;

    public readonly videoRepo: IVideoRepository;
    public readonly s3Service: IStorageService;
    public readonly transcodeProvider: ITranscodeService;
    public readonly cleanupService: CleanupService;
    public readonly uploadService: UploadService;
    public readonly videoService: VideoService;
    public readonly transcodeService: TranscodeService;
    public readonly uploadController: UploadController;
    public readonly videoController: VideoController;
    public readonly transcodeController: TranscodeController;

    private constructor() {

        // 1. Infrastructure (Leaf nodes)
        this.s3Service = new S3StorageService();
        this.videoRepo = new MongoVideoRepository();
        this.transcodeProvider = new MediaConvertService();

        // 2. Core Services (Depend on Infrastructure)
        this.cleanupService = new CleanupService(this.videoRepo, this.s3Service);
        this.transcodeService = new TranscodeService(this.transcodeProvider, this.videoRepo);
        this.uploadService = new UploadService(this.s3Service, this.videoRepo, this.transcodeService);
        this.videoService = new VideoService(this.videoRepo, this.s3Service);

        // 3. Controllers (Depend on Core/Infrastructure)
        this.uploadController = new UploadController(this.uploadService);
        this.videoController = new VideoController(this.videoService);
        this.transcodeController = new TranscodeController(this.transcodeService);

        if (this.transcodeProvider.isEnabled()) {
            logger.info('MediaConvert transcoding is ENABLED');
        } else {
            logger.info('MediaConvert transcoding is DISABLED (missing endpoint or role ARN)');
        }
    }

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }
}
