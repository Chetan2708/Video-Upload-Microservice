export interface UploadPart {
    PartNumber: number;
    ETag: string;
}

export interface InitUploadResponse {
    videoId: string;
    uploadId: string;
    key: string;
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
