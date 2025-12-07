export interface VideoMeta {
    _id: string;
    key: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    userId: string;
    status: "uploading" | "uploaded" | "processing" | "ready" | "failed";
    createdAt: string;
    updatedAt: string;
}

export interface VideoListResponse {
    videos: VideoMeta[];
}

export interface VideoGetResponse {
    video: VideoMeta;
}
