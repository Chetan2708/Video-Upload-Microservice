export type VideoStatus = "INITIATED" | "UPLOADING" | "COMPLETING" | "UPLOADED" | "PROCESSING" | "DONE" | "FAILED";

export interface VideoMeta {
    _id: string;
    key: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    userId: string;
    status: VideoStatus;
    createdAt: string;
    updatedAt: string;
}

export interface VideoListResponse {
    videos: VideoMeta[];
}

export interface VideoGetResponse {
    video: VideoMeta;
}
