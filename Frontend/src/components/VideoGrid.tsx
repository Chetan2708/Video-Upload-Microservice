import { Film, Info } from 'lucide-react';
import type { VideoMeta } from '../types';
import { formatFileSize, formatDate } from '../utils/format';

interface VideoGridProps {
    videos: VideoMeta[];
    onPlayVideo: (videoId: string) => void;
    onVideoDetails?: (videoId: string) => void;
}

/**
 * Deterministic hue from a string so each video card gets a unique gradient.
 */
const hashHue = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
};

export const VideoGrid = ({ videos, onPlayVideo, onVideoDetails }: VideoGridProps) => {
    return (
        <div className="video-grid">
            {videos.map(video => {
                const hue = hashHue(video.videoId);
                return (
                    <div
                        key={video.videoId}
                        id={`video-${video.videoId}`}
                        className="video-card group"
                        onClick={() => onPlayVideo(video.videoId)}
                    >
                        <div
                            className="video-card-thumbnail"
                            style={{
                                background: `linear-gradient(135deg, hsl(${hue}, 60%, 18%) 0%, hsl(${(hue + 40) % 360}, 50%, 12%) 100%)`,
                            }}
                        >
                            <Film
                                className="video-card-film-icon"
                                size={32}
                                strokeWidth={1.5}
                            />
                            <div className="video-card-play-icon">▶</div>
                        </div>
                        <div className="video-card-body">
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <div className="video-card-title" style={{ flex: 1 }}>{video.fileName}</div>
                                {onVideoDetails && (
                                    <button
                                        className="btn-icon"
                                        style={{ padding: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        onClick={(e) => { e.stopPropagation(); onVideoDetails(video.videoId); }}
                                        title="View details"
                                    >
                                        <Info size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="video-card-meta">
                                <span className={`video-card-status status-${video.status.toLowerCase()}`}>
                                    {video.status}
                                </span>
                                <span>{formatFileSize(video.fileSize)}</span>
                                <span>{formatDate(video.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
