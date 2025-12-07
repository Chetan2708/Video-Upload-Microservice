import { UploadService } from "./UploadService";
import { VideoClient } from "../video/VideoClient";

export class UploadClient {
    private uploadService: UploadService;
    public videos: VideoClient;

    constructor(baseUrl: string) {
        this.uploadService = new UploadService(baseUrl);
        this.videos = new VideoClient(baseUrl);
    }

    upload(
        file: File,
        userId: string,
        onProgress: (percent: number) => void
    ) {
        return this.uploadService.uploadFile(file, userId, onProgress);
    }
}
