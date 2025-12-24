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

    async findByIdAndUser(videoId: string, userId: string): Promise<IVideoJob | null> {
        return await VideoModel.findOne({ videoId, userId }).lean();
    }

    async updateStatus(uploadId: string, status: IVideoJob['status']): Promise<IVideoJob | null> {
        return await VideoModel.findOneAndUpdate(
            { uploadId },
            { status },
            { new: true }
        ).lean();
    }

    async addPart(videoId: string, userId: string, part: { PartNumber: number; ETag: string }): Promise<boolean> {
        const partKey = `parts.${part.PartNumber}`;
        const res = await VideoModel.updateOne(
            {
                videoId,
                userId,
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
            const existing = await VideoModel.findOne({ videoId }, { [`parts.${part.PartNumber}`]: 1, status: 1, userId: 1 }).lean();

            if (!existing) {
                throw new NotFoundError("Video not found");
            }

            if (existing.userId !== userId) {
                throw new NotFoundError("Video not found");
            }

            if (existing.status !== 'INITIATED' && existing.status !== 'UPLOADING') {
                throw new ConflictError(`Invalid state: ${existing.status}`);
            }

            const existingPart = existing.parts?.[String(part.PartNumber)];
            if (existingPart && existingPart.etag !== part.ETag) {
                throw new ConflictError("Part already confirmed with different ETag");
            }

            throw new AppError("Concurrent modification or unknown error", 500);
        }

        return true;
    }

    async tryAcquireCompletionLock(videoId: string, userId: string): Promise<IVideoJob | null> {
        const res = await VideoModel.findOneAndUpdate(
            { videoId, userId, status: 'UPLOADING' },
            {
                $set: {
                    status: 'COMPLETING',
                    completingAt: new Date()
                }
            },
            { new: true }
        ).lean();
        return res;
    }

    async persistCompletionSnapshot(videoId: string, userId: string, parts: { PartNumber: number; ETag: string }[]): Promise<void> {
        await VideoModel.updateOne(
            { videoId, userId, status: 'COMPLETING' },
            { $set: { completionParts: parts } }
        );
    }

    async finalizeUpload(videoId: string, userId: string): Promise<boolean> {
        const res = await VideoModel.updateOne(
            { videoId, userId, status: 'COMPLETING' },
            { $set: { status: 'UPLOADED' } }
        );
        return res.modifiedCount > 0;
    }
}
