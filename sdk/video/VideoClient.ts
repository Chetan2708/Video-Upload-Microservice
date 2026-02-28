import axios from "axios";
import type { VideoListResponse, VideoGetResponse } from "./types.js";

export class VideoClient {
    private api;

    constructor(baseUrl: string, authToken: string) {
        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        });
    }

    async list(userId: string) {
        const { data } = await this.api.get<VideoListResponse>(`/api/v1/videos`, {
            params: { userId }
        });
        return data.videos;
    }

    async get(videoId: string) {
        const { data } = await this.api.get<VideoGetResponse>(`/api/v1/videos/${videoId}`);
        return data.video;
    }

    async status(videoId: string) {
        const { data } = await this.api.get(`/api/v1/videos/status/${videoId}`);
        return data.status;
    }
}
