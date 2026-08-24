export interface User {
    id: string;
    email: string;
    name: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export type VideoStatus = 'INITIATED' | 'UPLOADING' | 'COMPLETING' | 'UPLOADED' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface VideoMeta {
    videoId: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    userId: string;
    status: VideoStatus;
    createdAt: string;
    updatedAt: string;
}

export interface VideoWithUrl extends VideoMeta {
    url: string | null;
}
