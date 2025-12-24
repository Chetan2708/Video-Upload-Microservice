
import { Schema, model } from 'mongoose';
import { IVideoJob } from '../../../core/interfaces/IVideoRepository';
import { v4 as uuidv4 } from 'uuid';

const videoSchema = new Schema<IVideoJob>({
    videoId: { type: String, default: () => uuidv4(), unique: true },
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    contentType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadId: { type: String, required: true },
    s3Key: { type: String, required: true },
    status: {
        type: String,
        enum: ["INITIATED", "UPLOADING", "COMPLETING", "UPLOADED", "PROCESSING", "DONE", "FAILED"],
        default: "INITIATED"
    },
    failureReason: { type: String },
    completingAt: { type: Date },
    completionParts: {
        type: [{
            PartNumber: Number,
            ETag: String
        }],
        default: []
    },
    processedFiles: { type: [String], default: [] },
    parts: {
        type: Map,
        of: new Schema({
            etag: { type: String, required: true },
            confirmedAt: { type: Date, required: true }
        }, { _id: false }),
        default: {}
    }
}, {
    timestamps: true
});

export const VideoModel = model<IVideoJob>('Video', videoSchema);
