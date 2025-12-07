export interface UploadPart {
    PartNumber: number;
    ETag: string;
}

export interface InitUploadResponse {
    uploadId: string;
    key: string;
    videoId?: string;
}
