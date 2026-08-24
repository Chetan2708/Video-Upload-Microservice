import type { VideoMeta } from '../types';
import { formatFileSize, formatDate } from '../utils/format';

interface VideoGridProps {
    videos: VideoMeta[];
    onPlayVideo: (videoId: string) => void;
}

export const VideoGrid = ({ videos, onPlayVideo }: VideoGridProps) => {
    return (
        <div className="video-grid">
            {videos.map(video => (
                <div
                    key={video.videoId}
                    id={`video-${video.videoId}`}
                    className="video-card group"
                    onClick={() => onPlayVideo(video.videoId)}
                >
                    <div className="video-card-thumbnail">
                        <img 
                            src={`https://picsum.photos/seed/${video.videoId}/400/225`} 
                            alt={video.fileName}
                            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="video-card-play-icon">▶</div>
                    </div>
                    <div className="video-card-body">
                        <div className="video-card-title">{video.fileName}</div>
                        <div className="video-card-meta">
                            <span className={`video-card-status status-${video.status.toLowerCase()}`}>
                                {video.status}
                            </span>
                            <span>{formatFileSize(video.fileSize)}</span>
                            <span>{formatDate(video.createdAt)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
