export interface IStorageService {
    initiateMultipartUpload(fileName: string, contentType: string): Promise<{ uploadId: string; key: string }>;
    generatePresignedUrl(key: string, uploadId: string, partNumber: number): Promise<string>;
    completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]): Promise<void>;
    generatePresignedDownloadUrl(key: string): Promise<string>;
    abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}
