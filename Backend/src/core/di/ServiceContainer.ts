import { IStorageService } from '../interfaces/IStorageService';
import { IVideoRepository } from '../interfaces/IVideoRepository';
import { S3StorageService } from '../../infrastructure/aws/S3StorageService';
import { MongoVideoRepository } from '../../infrastructure/repositories/MongoVideoRepository';
import { CleanupService } from '../services/CleanupService';
import { UploadService } from '../services/UploadService';
import { VideoService } from '../services/VideoService';
import { UploadController } from '../../interface-adapters/controllers/UploadController';
import { VideoController } from '../../interface-adapters/controllers/VideoController';

export class ServiceContainer {
    private static instance: ServiceContainer;

    public readonly videoRepo: IVideoRepository;
    public readonly s3Service: IStorageService;
    public readonly cleanupService: CleanupService;
    public readonly uploadService: UploadService;
    public readonly videoService: VideoService;
    public readonly uploadController: UploadController;
    public readonly videoController: VideoController;

    private constructor() {

        // 1. Infrastructure (Leaf nodes)
        this.s3Service = new S3StorageService();
        this.videoRepo = new MongoVideoRepository();

        // 2. Core Services (Depend on Infrastructure)
        this.cleanupService = new CleanupService(this.videoRepo, this.s3Service);
        this.uploadService = new UploadService(this.s3Service, this.videoRepo);
        this.videoService = new VideoService(this.videoRepo, this.s3Service);

        // 3. Controllers (Depend on Core/Infrastructure)
        this.uploadController = new UploadController(this.uploadService);
        this.videoController = new VideoController(this.videoService);

    }

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }
}
