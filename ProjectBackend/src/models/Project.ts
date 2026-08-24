import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    name: string;
    userId: mongoose.Types.ObjectId;
    videos: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        name: { type: String, required: true, trim: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        videos: { type: [String], default: [] }
    },
    { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
