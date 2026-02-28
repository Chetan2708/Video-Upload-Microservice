import { UploadService } from "./UploadService.js";
import { VideoClient } from "../video/VideoClient.js";

export class UploadClient {
    private uploadService: UploadService;
    public videos: VideoClient;

    constructor(baseUrl: string, authToken: string) {
        this.uploadService = new UploadService(baseUrl, authToken);
        this.videos = new VideoClient(baseUrl, authToken);
    }

    upload(
        file: File,
        userId: string,
        onProgress: (percent: number) => void
    ) {
        return this.uploadService.uploadFile(file, onProgress);
    }
}
