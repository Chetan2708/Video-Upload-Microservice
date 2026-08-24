import { useState, useEffect, useCallback } from 'react';
import * as videoApi from '../api/videoApi';
import * as projectApi from '../api/projectApi';
import type { VideoMeta, VideoWithUrl } from '../types';

interface UseVideosReturn {
    videos: VideoMeta[];
    loading: boolean;
    playingVideo: VideoWithUrl | null;
    loadVideos: (projectId: string) => Promise<void>;
    playVideo: (videoId: string) => Promise<void>;
    closePlayer: () => void;
}

export const useVideos = (projectId: string | null): UseVideosReturn => {
    const [videos, setVideos] = useState<VideoMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [playingVideo, setPlayingVideo] = useState<VideoWithUrl | null>(null);

    const loadVideos = useCallback(async (pid: string) => {
        setLoading(true);
        try {
            const videoIds = await projectApi.getProjectVideos(pid);
            if (videoIds.length === 0) {
                setVideos([]);
                return;
            }
            
            // Switch from looping individual HTTP fetches (which tripped the rate limit) to a single bulk POST payload
            const vids = await videoApi.getVideosBulk(videoIds);
            setVideos(vids as any);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (projectId) {
            loadVideos(projectId);
        } else {
            setVideos([]);
        }
    }, [projectId, loadVideos]);

    const playVideo = useCallback(async (videoId: string) => {
        const video = await videoApi.getVideo(videoId);
        setPlayingVideo(video);
    }, []);

    const closePlayer = useCallback(() => {
        setPlayingVideo(null);
    }, []);

    return { videos, loading, playingVideo, loadVideos, playVideo, closePlayer };
};
