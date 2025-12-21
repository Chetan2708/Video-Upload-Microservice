import axios from "axios";
import type { VideoListResponse, VideoGetResponse } from "./types.js";

export class VideoClient {
    private api;

    constructor(baseUrl: string) {
        this.api = axios.create({
            baseURL: baseUrl
        });
    }

    async list(userId: string) {
        const { data } = await this.api.get<VideoListResponse>(`/videos`, {
            params: { userId }
        });
        return data.videos;
    }

    async get(videoId: string) {
        const { data } = await this.api.get<VideoGetResponse>(`/videos/${videoId}`);
        return data.video;
    }

    async status(videoId: string) {
        const { data } = await this.api.get(`/videos/status/${videoId}`);
        return data.status;
    }
}
