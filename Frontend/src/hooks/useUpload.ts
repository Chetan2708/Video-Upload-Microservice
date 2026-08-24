import { useState, useRef, useCallback } from 'react';
import * as videoApi from '../api/videoApi';
import * as projectApi from '../api/projectApi';
import { useToast } from '../context/ToastContext';
import type { UploadState, PartInfo, UploadHandle } from '../api/videoApi';

export interface UploadSpeedInfo {
    bytesPerSecond: number;
    etaSeconds: number;
}

interface UseUploadReturn {
    uploadState: UploadState;
    uploadProgress: number;
    uploadFileName: string;
    uploadedBytes: number;
    totalBytes: number;
    parts: PartInfo[];
    speedInfo: UploadSpeedInfo | null;
    errorMessage: string | null;
    dragging: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (e: React.DragEvent) => void;
    setDragging: (value: boolean) => void;
    openFilePicker: () => void;
    cancelUpload: () => void;
    retryUpload: () => void;
    clearError: () => void;
}

export const useUpload = (
    projectId: string | null,
    onUploadComplete: (projectId: string) => Promise<void>
): UseUploadReturn => {
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadedBytes, setUploadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [parts, setParts] = useState<PartInfo[]>([]);
    const [speedInfo, setSpeedInfo] = useState<UploadSpeedInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadHandleRef = useRef<UploadHandle | null>(null);
    const speedTracker = useRef<{ startTime: number; lastBytes: number; lastTime: number }>({
        startTime: 0,
        lastBytes: 0,
        lastTime: 0,
    });

    const { addToast } = useToast();

    const updateSpeed = useCallback((uploaded: number, total: number) => {
        const now = Date.now();
        const tracker = speedTracker.current;

        if (tracker.startTime === 0) {
            tracker.startTime = now;
            tracker.lastBytes = uploaded;
            tracker.lastTime = now;
            return;
        }

        const elapsed = (now - tracker.lastTime) / 1000;
        if (elapsed < 0.5) return; // Don't update too frequently

        const bytesDelta = uploaded - tracker.lastBytes;
        const bps = bytesDelta / elapsed;
        const remaining = total - uploaded;
        const eta = bps > 0 ? remaining / bps : 0;

        tracker.lastBytes = uploaded;
        tracker.lastTime = now;

        setSpeedInfo({ bytesPerSecond: bps, etaSeconds: eta });
    }, []);

    const resetState = useCallback(() => {
        setUploadState('idle');
        setUploadProgress(0);
        setUploadFileName('');
        setUploadedBytes(0);
        setTotalBytes(0);
        setParts([]);
        setSpeedInfo(null);
        setErrorMessage(null);
        uploadHandleRef.current = null;
        speedTracker.current = { startTime: 0, lastBytes: 0, lastTime: 0 };
    }, []);

    const upload = useCallback(async (file: File) => {
        if (!projectId || uploadState === 'uploading' || uploadState === 'completing') return;

        resetState();
        setUploadFileName(file.name);
        setTotalBytes(file.size);

        const handle = videoApi.uploadVideo(file, {
            onProgress: (percent, uploaded, total) => {
                setUploadProgress(percent);
                setUploadedBytes(uploaded);
                setTotalBytes(total);
                updateSpeed(uploaded, total);
            },
            onPartUpdate: (partInfos) => {
                setParts(partInfos);
            },
            onStateChange: (state) => {
                setUploadState(state);
            },
        });

        uploadHandleRef.current = handle;

        try {
            const uploadedVideo = await handle.promise;
            await projectApi.addVideoToProject(projectId, uploadedVideo.videoId);
            await onUploadComplete(projectId);
            addToast({ type: 'success', title: 'Upload complete', message: file.name });
            // Reset after a brief success display
            setTimeout(resetState, 2000);
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                addToast({ type: 'info', title: 'Upload cancelled', message: file.name });
                resetState();
                return;
            }
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setErrorMessage(msg);
            addToast({ type: 'error', title: 'Upload failed', message: msg });
        }
    }, [projectId, uploadState, onUploadComplete, addToast, updateSpeed, resetState]);

    const cancelUpload = useCallback(() => {
        uploadHandleRef.current?.abort();
    }, []);

    const retryUpload = useCallback(async () => {
        if (!uploadHandleRef.current || !projectId) return;
        setErrorMessage(null);
        speedTracker.current = { startTime: 0, lastBytes: 0, lastTime: 0 };

        try {
            const uploadedVideo = await uploadHandleRef.current.retry();
            await projectApi.addVideoToProject(projectId, uploadedVideo.videoId);
            await onUploadComplete(projectId);
            addToast({ type: 'success', title: 'Upload complete', message: uploadFileName });
            setTimeout(resetState, 2000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Retry failed';
            setErrorMessage(msg);
            addToast({ type: 'error', title: 'Retry failed', message: msg });
        }
    }, [projectId, uploadFileName, onUploadComplete, addToast, resetState]);

    const clearError = useCallback(() => {
        setErrorMessage(null);
        resetState();
    }, [resetState]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = '';
    }, [upload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) upload(file);
    }, [upload]);

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        uploadState,
        uploadProgress,
        uploadFileName,
        uploadedBytes,
        totalBytes,
        parts,
        speedInfo,
        errorMessage,
        dragging,
        fileInputRef,
        handleFileSelect,
        handleDrop,
        setDragging,
        openFilePicker,
        cancelUpload,
        retryUpload,
        clearError,
    };
};
