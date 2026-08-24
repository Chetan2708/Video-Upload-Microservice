import type { VideoWithUrl } from '../types';

interface VideoPlayerModalProps {
    video: VideoWithUrl;
    onClose: () => void;
}

export const VideoPlayerModal = ({ video, onClose }: VideoPlayerModalProps) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{video.fileName}</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {video.url ? (
                    <video className="modal-video" controls autoPlay src={video.url}>
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                        <p>Video is not ready for playback yet.</p>
                        <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-muted)' }}>
                            Status: {video.status}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
