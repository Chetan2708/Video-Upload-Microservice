export interface IVideoJob {
    videoId: string;
    userId: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadId: string;
    s3Key: string;
    status: "uploading" | "uploaded" | "processing" | "completed" | "failed";
    processedFiles: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IVideoRepository {
    create(video: Partial<IVideoJob>): Promise<IVideoJob>;
    updateStatus(uploadId: string, status: IVideoJob['status']): Promise<IVideoJob | null>;
    findByUploadId(uploadId: string): Promise<IVideoJob | null>;
    findByUserId(userId: string): Promise<IVideoJob[]>;
    findById(videoId: string): Promise<IVideoJob | null>;
}
