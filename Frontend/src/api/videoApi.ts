import { createApiClient } from './apiClient';
import { config } from '../config';
import type { VideoMeta, VideoWithUrl } from '../types';

const client = createApiClient(config.videoApiUrl);

export const getVideo = async (videoId: string) => {
    const { data } = await client.get<{ video: VideoWithUrl }>(`/videos/${videoId}`);
    return data.video;
};

export const getVideosBulk = async (videoIds: string[]) => {
    const { data } = await client.post<{ videos: VideoWithUrl[] }>('/videos/bulk', { videoIds });
    return data.videos;
};

export const getVideoStatus = async (videoId: string) => {
    const { data } = await client.get<{ status: string }>(`/videos/status/${videoId}`);
    return data.status;
};

// ── Chunked multipart upload ──

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_CONCURRENCY = 3;

interface InitResponse {
    videoId: string;
    uploadId: string;
    key: string;
}

export const uploadVideo = async (
    file: File,
    onProgress: (percent: number) => void
): Promise<VideoMeta> => {
    const { data: initData } = await client.post<InitResponse>('/upload/init', {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
    });

    const { videoId } = initData;
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    let completed = 0;

    const tasks: (() => Promise<void>)[] = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);

        tasks.push(async () => {
            const { data: signData } = await client.post<{ url: string }>('/upload/sign-part', {
                videoId,
                partNumber,
            });

            const chunk = file.slice(start, end);
            const uploadRes = await fetch(signData.url, {
                method: 'PUT',
                body: chunk,
                headers: { 'Content-Type': file.type },
            });

            const etag = uploadRes.headers.get('ETag')!.replace(/"/g, '');

            await client.post('/upload/confirm-part', {
                videoId,
                partNumber,
                etag,
            });

            completed++;
            onProgress(Math.round((completed / totalParts) * 100));
        });
    }

    await processQueue(tasks, MAX_CONCURRENCY);
    await client.post('/upload/complete', { videoId });

    return {
        videoId,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        userId: '',
        status: 'UPLOADED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

async function processQueue(tasks: (() => Promise<void>)[], limit: number) {
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
