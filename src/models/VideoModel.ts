
import { Schema, model } from 'mongoose';
import { IVideoJob } from './IVideo';
import { v4 as uuidv4 } from 'uuid';

const videoSchema = new Schema<IVideoJob>({
    videoId: { type: String, default: uuidv4, unique: true },
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    contentType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadId: { type: String, required: true },
    s3Key: { type: String, required: true },
    status: {
        type: String,
        enum: ["uploading", "uploaded", "processing", "completed", "failed"],
        default: "uploading"
    },
    processedFiles: { type: [String], default: [] }
}, {
    timestamps: true
});

export const VideoModel = model<IVideoJob>('Video', videoSchema);
