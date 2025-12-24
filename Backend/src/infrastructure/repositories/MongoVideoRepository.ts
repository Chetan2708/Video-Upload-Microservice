
import { IVideoRepository, IVideoJob } from '../../core/interfaces/IVideoRepository';
import { VideoModel } from '../database/models/VideoModel';

export class MongoVideoRepository implements IVideoRepository {
    constructor() { }

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

    async addPart(videoId: string, part: { PartNumber: number; ETag: string }): Promise<boolean> {
        const res = await VideoModel.updateOne(
            { videoId, status: { $in: ['INITIATED', 'UPLOADING'] } },
            {
                $push: { parts: part },
                $set: { status: 'UPLOADING' }
            }
        );
        return res.modifiedCount > 0;
    }

    async markAsUploaded(videoId: string): Promise<boolean> {
        const res = await VideoModel.updateOne(
            { videoId, status: 'UPLOADING' },
            { $set: { status: 'UPLOADED' } }
        );
        return res.modifiedCount > 0;
    }
}
