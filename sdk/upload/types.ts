export interface UploadPart {
    PartNumber: number;
    ETag: string;
}

export interface InitUploadResponse {
    uploadId: string;
    key: string;
    videoId?: string;
}

export interface CompleteUploadResponse {
    message: string;
    result: {
        videoId: string;
        fileName: string;
        fileSize: number;
        status: string;
    };
}
