import { useState, useEffect, useCallback } from 'react';
import * as videoApi from '../api/videoApi';
import * as projectApi from '../api/projectApi';
import type { VideoMeta, VideoWithUrl } from '../types';

interface UseVideosReturn {
    videos: VideoMeta[];
    loading: boolean;
    error: string | null;
    playingVideo: VideoWithUrl | null;
    loadVideos: (projectId: string) => Promise<void>;
    playVideo: (videoId: string) => Promise<void>;
    closePlayer: () => void;
    retryLoadVideos: (projectId: string) => void;
}

export const useVideos = (projectId: string | null): UseVideosReturn => {
    const [videos, setVideos] = useState<VideoMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playingVideo, setPlayingVideo] = useState<VideoWithUrl | null>(null);

    const loadVideos = useCallback(async (pid: string) => {
        setLoading(true);
        setError(null);
        try {
            const videoIds = await projectApi.getProjectVideos(pid);
            if (videoIds.length === 0) {
                setVideos([]);
                return;
            }
            
            // Switch from looping individual HTTP fetches (which tripped the rate limit) to a single bulk POST payload
            const vids = await videoApi.getVideosBulk(videoIds);
            setVideos(vids as VideoMeta[]);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load videos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (projectId) {
            loadVideos(projectId);
        } else {
            setVideos([]);
            setError(null);
        }
    }, [projectId, loadVideos]);

    const playVideo = useCallback(async (videoId: string) => {
        const video = await videoApi.getVideo(videoId);
        setPlayingVideo(video);
    }, []);

    const closePlayer = useCallback(() => {
        setPlayingVideo(null);
    }, []);

    const retryLoadVideos = useCallback((pid: string) => {
        loadVideos(pid);
    }, [loadVideos]);

    return { videos, loading, error, playingVideo, loadVideos, playVideo, closePlayer, retryLoadVideos };
};
