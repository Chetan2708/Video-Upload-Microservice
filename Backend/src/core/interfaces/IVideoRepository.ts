export interface IVideoJob {
    videoId: string;
    userId: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadId: string;
    s3Key: string;
    status: "INITIATED" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "DONE" | "FAILED";
    processedFiles: string[];
    parts: Record<string, { etag: string; confirmedAt: Date }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVideoRepository {
    create(video: Partial<IVideoJob>): Promise<IVideoJob>;
    updateStatus(uploadId: string, status: IVideoJob['status']): Promise<IVideoJob | null>;
    addPart(videoId: string, part: { PartNumber: number; ETag: string }): Promise<boolean>;
    markAsUploaded(videoId: string): Promise<boolean>;
    findByUploadId(uploadId: string): Promise<IVideoJob | null>;
    findByUserId(userId: string): Promise<IVideoJob[]>;
    findById(videoId: string): Promise<IVideoJob | null>;
}
