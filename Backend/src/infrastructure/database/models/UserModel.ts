import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    name: string;
    credits: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        credits: { type: Number, default: 3 }
    },
    { timestamps: true }
);

// Prevent OverwriteModelError if already compiled
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
