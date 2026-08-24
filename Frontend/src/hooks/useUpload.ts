import { useState, useRef, useCallback } from 'react';
import * as videoApi from '../api/videoApi';
import * as projectApi from '../api/projectApi';

interface UseUploadReturn {
    uploading: boolean;
    uploadProgress: number;
    uploadFileName: string;
    dragging: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (e: React.DragEvent) => void;
    setDragging: (value: boolean) => void;
    openFilePicker: () => void;
}

export const useUpload = (
    projectId: string | null,
    onUploadComplete: (projectId: string) => Promise<void>
): UseUploadReturn => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFileName, setUploadFileName] = useState('');
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const upload = useCallback(async (file: File) => {
        if (!projectId || uploading) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadFileName(file.name);
        try {
            const uploadedVideo = await videoApi.uploadVideo(file, setUploadProgress);
            await projectApi.addVideoToProject(projectId, uploadedVideo.videoId);
            await onUploadComplete(projectId);
        } catch (err) {
            console.error(err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [projectId, uploading, onUploadComplete]);

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
        uploading,
        uploadProgress,
        uploadFileName,
        dragging,
        fileInputRef,
        handleFileSelect,
        handleDrop,
        setDragging,
        openFilePicker,
    };
};
