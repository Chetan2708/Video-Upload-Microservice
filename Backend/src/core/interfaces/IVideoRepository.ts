export interface IVideoJob {
    videoId: string;
    userId: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadId: string;
    s3Key: string;
    status: "INITIATED" | "UPLOADING" | "COMPLETING" | "UPLOADED" | "PROCESSING" | "DONE" | "FAILED";
    failureReason?: string;
    completingAt?: Date;
    completionParts?: { PartNumber: number; ETag: string }[];
    processedFiles: string[];
    parts: Record<string, { etag: string; confirmedAt: Date }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVideoRepository {
    create(video: Partial<IVideoJob>): Promise<IVideoJob>;
    updateStatus(uploadId: string, status: IVideoJob['status']): Promise<IVideoJob | null>;
    addPart(videoId: string, userId: string, part: { PartNumber: number; ETag: string }): Promise<boolean>;
    tryAcquireCompletionLock(videoId: string, userId: string): Promise<IVideoJob | null>;
    persistCompletionSnapshot(videoId: string, userId: string, parts: { PartNumber: number; ETag: string }[]): Promise<void>;
    finalizeUpload(videoId: string, userId: string): Promise<boolean>;
    findByUploadId(uploadId: string): Promise<IVideoJob | null>;
    findByUserId(userId: string): Promise<IVideoJob[]>;
    findById(videoId: string): Promise<IVideoJob | null>;
    findByIdAndUser(videoId: string, userId: string): Promise<IVideoJob | null>;

    // Cleanup methods
    findStaleUploads(criteria: { status: IVideoJob['status']; olderThan: Date }): Promise<IVideoJob[]>;
    markAsFailed(videoId: string, reason: string): Promise<boolean>;
}
