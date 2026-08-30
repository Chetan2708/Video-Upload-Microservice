import type { VideoWithUrl } from '../types';
import { formatFileSize } from '../utils/format';
import { X, FileVideo, HardDrive, UploadCloud, Calendar, Info } from 'lucide-react';

interface VideoDetailsPanelProps {
    video: VideoWithUrl;
    onClose: () => void;
}

export const VideoDetailsPanel = ({ video, onClose }: VideoDetailsPanelProps) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content video-panel-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">
                        <FileVideo size={16} className="inline-icon" style={{ marginRight: 8 }} />
                        {video.fileName}
                    </span>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="video-panel-body">
                    {/* Top: Video Player */}
                    <div className="video-player-section">
                        {video.url ? (
                            <video className="modal-video" controls autoPlay src={video.url}>
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="video-placeholder">
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                                <p>Video is not ready for playback yet.</p>
                                <p className="video-placeholder-status">
                                    Status: {video.status}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Bottom: Details */}
                    <div className="video-details-section">
                        <h3 className="details-heading">Details</h3>
                        
                        <div className="details-grid">
                            <div className="detail-row">
                                <span className="detail-label">File</span>
                                <span className="detail-value">{video.fileName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Size</span>
                                <span className="detail-value">{formatFileSize(video.fileSize)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Type</span>
                                <span className="detail-value">{video.contentType || 'video/mp4'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status</span>
                                <span className={`detail-value status-badge status-${video.status.toLowerCase()}`}>
                                    {video.status}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Uploaded</span>
                                <span className="detail-value">
                                    {new Date(video.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </span>
                            </div>
                            
                            <div className="detail-divider"></div>
                            
                            <div className="detail-row">
                                <span className="detail-label"><HardDrive size={14} className="inline-icon"/> Storage</span>
                                <span className="detail-value">AWS S3</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label"><UploadCloud size={14} className="inline-icon"/> Upload</span>
                                <span className="detail-value">Multipart</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
