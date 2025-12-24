import axios from "axios";
import { retryAsync } from "./retry.js";
import type { UploadPart, InitUploadResponse, CompleteUploadResponse } from "./types.js";

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CONCURRENCY = 3;

export class UploadService {

    constructor(private baseUrl: string, private authToken: string) { }

    private get headers() {
        return {
            Authorization: `Bearer ${this.authToken}`
        };
    }

    async initiateUpload(file: File): Promise<InitUploadResponse> {
        const { data } = await axios.post(`${this.baseUrl}/upload/init`, {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size
        }, { headers: this.headers });

        return data;
    }

    async uploadChunk(
        file: File,
        videoId: string,
        partNumber: number,
        start: number,
        end: number
    ): Promise<void> {

        const { data } = await axios.post(`${this.baseUrl}/upload/sign-part`, {
            videoId,
            partNumber
        }, { headers: this.headers });

        const chunk = file.slice(start, end);

        const uploadRes = await retryAsync(() =>
            fetch(data.url, {
                method: "PUT",
                body: chunk,
                headers: { "Content-Type": file.type }
            })
        );

        const ETag = uploadRes.headers.get("ETag")!.replace(/"/g, "");

        await axios.post(`${this.baseUrl}/upload/confirm-part`, {
            videoId,
            partNumber,
            etag: ETag
        }, { headers: this.headers });
    }

    async completeUpload(videoId: string) {
        const { data } = await axios.post(`${this.baseUrl}/upload/complete`, {
            videoId
        }, { headers: this.headers });

        return data as CompleteUploadResponse;
    }

    async uploadFile(
        file: File,
        onProgress: (p: number) => void
    ) {
        const { videoId } = await this.initiateUpload(file);

        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        let completed = 0;

        const tasks: (() => Promise<void>)[] = [];

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);

            tasks.push(async () => {
                await this.uploadChunk(file, videoId, partNumber, start, end);
                completed++;
                onProgress(Math.round((completed / totalParts) * 100));
            });
        }

        await this.processQueue(tasks, MAX_CONCURRENCY);

        const response = await this.completeUpload(videoId);

        return response.result;
    }

    private async processQueue(tasks: (() => Promise<void>)[], limit: number) {
        const active: Promise<void>[] = [];

        for (const task of tasks) {
            const promise = task();
            active.push(promise);

            promise.finally(() => {
                active.splice(active.indexOf(promise), 1);
            });

            if (active.length >= limit) {
                await Promise.race(active);
            }
        }

        await Promise.all(active);
    }
}
