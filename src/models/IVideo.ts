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
