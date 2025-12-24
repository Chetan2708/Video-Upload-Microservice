import { IVideoRepository, IVideoJob } from '../../core/interfaces/IVideoRepository';
import { VideoModel } from '../database/models/VideoModel';
import { ConflictError, NotFoundError, AppError } from '../../core/errors/AppError';

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
        const partKey = `parts.${part.PartNumber}`;
        const res = await VideoModel.updateOne(
            {
                videoId,
                status: { $in: ['INITIATED', 'UPLOADING'] },
                $or: [
                    { [partKey]: { $exists: false } },
                    { [`${partKey}.etag`]: part.ETag }
                ]
            },
            {
                $set: {
                    [partKey]: {
                        etag: part.ETag,
                        confirmedAt: new Date()
                    },
                    status: 'UPLOADING'
                }
            }
        );

        if (res.matchedCount === 0) {
            // Failure Analysis
            const existing = await VideoModel.findOne({ videoId }, { [`parts.${part.PartNumber}`]: 1, status: 1 }).lean();

            if (!existing) {
                throw new NotFoundError("Video not found");
            }

            // Check state
            if (existing.status !== 'INITIATED' && existing.status !== 'UPLOADING') {
                throw new ConflictError(`Invalid state: ${existing.status}`);
            }

            // Check part conflict
            // @ts-ignore
            const existingPart = existing.parts?.[String(part.PartNumber)];
            if (existingPart && existingPart.etag !== part.ETag) {
                throw new ConflictError("Part already confirmed with different ETag");
            }

            // Unknown reason
            throw new AppError("Concurrent modification or unknown error", 500);
        }

        return true;
    }

    async markAsUploaded(videoId: string): Promise<boolean> {
        const res = await VideoModel.updateOne(
            { videoId, status: 'UPLOADING' },
            { $set: { status: 'UPLOADED' } }
        );
        return res.modifiedCount > 0;
    }
}
