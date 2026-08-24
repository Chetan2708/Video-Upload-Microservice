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
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

interface InitResponse {
    videoId: string;
    uploadId: string;
    key: string;
}

export type PartStatus = 'pending' | 'active' | 'done' | 'failed';

export interface PartInfo {
    partNumber: number;
    status: PartStatus;
    bytesUploaded: number;
    totalBytes: number;
    retryCount: number;
}

export interface UploadCallbacks {
    onProgress: (percent: number, uploadedBytes: number, totalBytes: number) => void;
    onPartUpdate: (parts: PartInfo[]) => void;
    onStateChange: (state: UploadState) => void;
}

export type UploadState = 'idle' | 'initializing' | 'uploading' | 'completing' | 'success' | 'error' | 'cancelled';

export interface UploadHandle {
    promise: Promise<VideoMeta>;
    abort: () => void;
    /** Re-upload only failed parts. Call after an error to resume. */
    retry: () => Promise<VideoMeta>;
}

async function retryFetch(
    url: string,
    options: RequestInit,
    maxRetries: number,
    signal?: AbortSignal
): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, { ...options, signal });
            if (!res.ok && attempt < maxRetries) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res;
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') throw err;
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
            }
        }
    }
    throw lastError;
}

export function uploadVideo(
    file: File,
    callbacks: UploadCallbacks
): UploadHandle {
    const abortController = new AbortController();
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);

    // Shared mutable state across upload/retry
    let videoId: string | null = null;
    const parts: PartInfo[] = Array.from({ length: totalParts }, (_, i) => ({
        partNumber: i + 1,
        status: 'pending' as PartStatus,
        bytesUploaded: 0,
        totalBytes: Math.min(CHUNK_SIZE, file.size - i * CHUNK_SIZE),
        retryCount: 0,
    }));

    const emitProgress = () => {
        const uploaded = parts.reduce((sum, p) => sum + p.bytesUploaded, 0);
        const percent = Math.round((uploaded / file.size) * 100);
        callbacks.onProgress(percent, uploaded, file.size);
        callbacks.onPartUpdate([...parts]);
    };

    const uploadPart = async (part: PartInfo) => {
        if (abortController.signal.aborted) return;

        part.status = 'active';
        emitProgress();

        const start = (part.partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);

        try {
            const { data: signData } = await client.post<{ url: string }>('/upload/sign-part', {
                videoId,
                partNumber: part.partNumber,
            }, { signal: abortController.signal });

            const chunk = file.slice(start, end);
            const uploadRes = await retryFetch(
                signData.url,
                { method: 'PUT', body: chunk, headers: { 'Content-Type': file.type } },
                MAX_RETRIES,
                abortController.signal
            );

            const etag = uploadRes.headers.get('ETag')!.replace(/"/g, '');

            await client.post('/upload/confirm-part', {
                videoId,
                partNumber: part.partNumber,
                etag,
            }, { signal: abortController.signal });

            part.status = 'done';
            part.bytesUploaded = part.totalBytes;
            emitProgress();
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                part.status = 'pending';
                throw err;
            }
            part.status = 'failed';
            part.retryCount++;
            emitProgress();
            throw err;
        }
    };

    const runUpload = async (partsToUpload: PartInfo[]): Promise<void> => {
        const active: Promise<void>[] = [];
        const errors: Error[] = [];

        for (const part of partsToUpload) {
            if (abortController.signal.aborted) break;

            const promise = uploadPart(part).catch(err => {
                if (!(err instanceof DOMException && err.name === 'AbortError')) {
                    errors.push(err instanceof Error ? err : new Error(String(err)));
                }
            });

            active.push(promise);
            promise.finally(() => {
                active.splice(active.indexOf(promise), 1);
            });

            if (active.length >= MAX_CONCURRENCY) {
                await Promise.race(active);
            }
        }

        await Promise.all(active);

        if (abortController.signal.aborted) {
            throw new DOMException('Upload cancelled', 'AbortError');
        }

        if (errors.length > 0) {
            const failedCount = parts.filter(p => p.status === 'failed').length;
            throw new Error(`${failedCount} part(s) failed to upload`);
        }
    };

    const execute = async (): Promise<VideoMeta> => {
        callbacks.onStateChange('initializing');

        const { data: initData } = await client.post<InitResponse>('/upload/init', {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
        }, { signal: abortController.signal });

        videoId = initData.videoId;

        callbacks.onStateChange('uploading');
        await runUpload(parts);

        callbacks.onStateChange('completing');
        await client.post('/upload/complete', { videoId }, { signal: abortController.signal });

        callbacks.onStateChange('success');
        return {
            videoId: initData.videoId,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            userId: '',
            status: 'UPLOADED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    };

    const retryFailed = async (): Promise<VideoMeta> => {
        if (!videoId) throw new Error('Cannot retry — upload was never initialized');

        const failedParts = parts.filter(p => p.status === 'failed');
        if (failedParts.length === 0) throw new Error('No failed parts to retry');

        // Reset failed parts to pending
        failedParts.forEach(p => { p.status = 'pending'; p.bytesUploaded = 0; });

        callbacks.onStateChange('uploading');
        await runUpload(failedParts);

        // Check if all parts are done now
        const stillFailed = parts.filter(p => p.status !== 'done');
        if (stillFailed.length > 0) {
            throw new Error(`${stillFailed.length} part(s) still failed after retry`);
        }

        callbacks.onStateChange('completing');
        await client.post('/upload/complete', { videoId }, { signal: abortController.signal });

        callbacks.onStateChange('success');
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

    const uploadPromise = execute().catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') {
            callbacks.onStateChange('cancelled');
        } else {
            callbacks.onStateChange('error');
        }
        throw err;
    });

    return {
        promise: uploadPromise,
        abort: () => abortController.abort(),
        retry: retryFailed,
    };
}
