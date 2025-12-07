
import { IVideoRepository, IVideoJob } from '../../core/interfaces/IVideoRepository';
import { VideoModel } from '../database/models/VideoModel';

export class MongoVideoRepository implements IVideoRepository {
    private static instance: MongoVideoRepository;

    private constructor() { }

    public static getInstance(): MongoVideoRepository {
        if (!MongoVideoRepository.instance) {
            MongoVideoRepository.instance = new MongoVideoRepository();
        }
        return MongoVideoRepository.instance;
    }

    async create(videoData: Partial<IVideoJob>): Promise<IVideoJob> {
        const video = await VideoModel.create(videoData);
        return video.toObject();
    }

    async findByUploadId(uploadId: string): Promise<IVideoJob | null> {
        return await VideoModel.findOne({ uploadId }).lean();
    }

    async findById(videoId: string): Promise<IVideoJob | null> {
        return await VideoModel.findOne({ videoId }).lean();
    }

    async findByUserId(userId: string): Promise<IVideoJob[]> {
        return await VideoModel.find({ userId }).sort({ createdAt: -1 }).lean();
    }

    async updateStatus(uploadId: string, status: IVideoJob['status']): Promise<IVideoJob | null> {
        return await VideoModel.findOneAndUpdate(
            { uploadId },
            { status },
            { new: true }
        ).lean();
    }
}
