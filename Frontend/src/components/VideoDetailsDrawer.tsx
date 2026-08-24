import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Play } from 'lucide-react';
import type { VideoWithUrl } from '../types';
import { formatFileSize, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';

interface VideoDetailsDrawerProps {
    video: VideoWithUrl | null;
    onClose: () => void;
    onPlay: (videoId: string) => void;
}

export const VideoDetailsDrawer = ({ video, onClose, onPlay }: VideoDetailsDrawerProps) => {
    const { addToast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast({ type: 'info', title: `${label} copied`, duration: 2000 });
        });
    };

    return (
        <AnimatePresence>
            {video && (
                <>
                    <motion.div
                        className="details-drawer-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="details-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        <div className="details-drawer-header">
                            <span className="details-drawer-title">Video Details</span>
                            <button className="modal-close" onClick={onClose}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="details-drawer-body">
                            <div className="details-row">
                                <span className="details-label">Filename</span>
                                <span className="details-value">{video.fileName}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Size</span>
                                <span className="details-value">{formatFileSize(video.fileSize)}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Type</span>
                                <span className="details-value">{video.contentType}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Status</span>
                                <span className={`video-card-status status-${video.status.toLowerCase()}`}>
                                    {video.status}
                                </span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Uploaded</span>
                                <span className="details-value">{formatDate(video.createdAt)}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Video ID</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="details-value" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                        {video.videoId}
                                    </span>
                                    <button className="copy-btn" onClick={() => copyToClipboard(video.videoId, 'Video ID')}>
                                        <Copy size={10} /> Copy
                                    </button>
                                </div>
                            </div>
                            {video.url && (
                                <div className="details-row">
                                    <span className="details-label">URL</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="details-value" style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Presigned URL
                                        </span>
                                        <button className="copy-btn" onClick={() => copyToClipboard(video.url!, 'URL')}>
                                            <Copy size={10} /> Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="details-actions">
                            {video.url && (
                                <button className="btn btn-primary btn-sm" onClick={() => onPlay(video.videoId)}>
                                    <Play size={14} /> Play Video
                                </button>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
