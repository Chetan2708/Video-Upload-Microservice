import { CheckCircle, AlertCircle, X, RotateCcw, Loader2, Zap, Film } from 'lucide-react';
import type { UploadState, PartInfo } from '../api/videoApi';
import type { UploadSpeedInfo } from '../hooks/useUpload';
import { formatFileSize } from '../utils/format';

interface UploadProgressProps {
    filename: string;
    progress: number;
    uploadState: UploadState;
    uploadedBytes: number;
    totalBytes: number;
    parts: PartInfo[];
    speedInfo: UploadSpeedInfo | null;
    errorMessage: string | null;
    maxConcurrency: number;
    onCancel: () => void;
    onRetry: () => void;
    onDismiss: () => void;
}

const formatSpeed = (bps: number): string => {
    if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bps >= 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${bps.toFixed(0)} B/s`;
};

const formatEta = (seconds: number): string => {
    if (seconds <= 0 || !isFinite(seconds)) return '—';
    if (seconds < 60) return `${Math.ceil(seconds)} sec left`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s left`;
    return `${Math.floor(seconds / 3600)}h left`;
};

const STATE_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
    initializing: { icon: Loader2, label: 'Initializing…', color: 'var(--info)' },
    uploading: { icon: Zap, label: 'Uploading', color: 'var(--accent-primary)' },
    completing: { icon: Loader2, label: 'Completing upload...', color: 'var(--info)' },
    processing: { icon: Loader2, label: 'Processing video...', color: 'var(--info)' },
    success: { icon: CheckCircle, label: 'Uploaded', color: 'var(--success)' },
    error: { icon: AlertCircle, label: 'Failed', color: 'var(--danger)' },
    cancelled: { icon: X, label: 'Cancelled', color: 'var(--text-muted)' },
};

export const UploadProgress = ({
    filename,
    progress,
    uploadState,
    uploadedBytes,
    totalBytes,
    parts,
    speedInfo,
    errorMessage,
    maxConcurrency,
    onCancel,
    onRetry,
    onDismiss,
}: UploadProgressProps) => {
    const stateInfo = STATE_CONFIG[uploadState] || STATE_CONFIG.uploading;
    const Icon = stateInfo.icon;
    const isUploading = uploadState === 'uploading' || uploadState === 'initializing';
    const isProcessingPhase = uploadState === 'completing' || uploadState === 'processing';
    const isActive = isUploading || isProcessingPhase;
    const isError = uploadState === 'error';
    const isSuccess = uploadState === 'success';
    const isCancelled = uploadState === 'cancelled';

    const activeParts = parts.filter(p => p.status === 'active');
    const doneParts = parts.filter(p => p.status === 'done');
    const failedParts = parts.filter(p => p.status === 'failed');

    const activePartsDisplay = activeParts.map(p => p.partNumber).join(', ');

    return (
        <div className={`upload-progress-card ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''} ${isCancelled ? 'cancelled' : ''}`}>
            <div className="upload-header">
                <div className="upload-title">
                    <Film size={18} className="upload-icon" />
                    <span className="filename" title={filename}>{filename}</span>
                </div>
                <div className="upload-percent">
                    {progress}%
                </div>
            </div>

            <div className="upload-bar-container">
                <div className="upload-bar-bg" />
                <div 
                    className={`upload-bar-fill ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''} ${isCancelled ? 'cancelled' : ''}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="upload-size">
                {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}
            </div>

            {isUploading && speedInfo && (
                <div className="upload-metrics">
                    <span>{formatSpeed(speedInfo.bytesPerSecond)}</span>
                    <span>{maxConcurrency} concurrent parts</span>
                    <span>{formatEta(speedInfo.etaSeconds)}</span>
                </div>
            )}

            {isUploading && parts.length > 0 && (
                <div className="upload-parts-info">
                    {activeParts.length > 0 ? (
                        <span>Part {activePartsDisplay} / {parts.length}</span>
                    ) : (
                        <span>{doneParts.length} / {parts.length} parts done</span>
                    )}
                </div>
            )}
            
            {isProcessingPhase && (
                <div className="upload-processing-steps">
                    <div className="processing-step done">
                        <CheckCircle size={14} /> All {parts.length} parts uploaded
                    </div>
                    <div className={`processing-step ${uploadState === 'processing' ? 'done' : 'active'}`}>
                        {uploadState === 'processing' ? <CheckCircle size={14} /> : <Loader2 size={14} className="spin" />} 
                        Multipart upload finalized
                    </div>
                    {uploadState === 'processing' && (
                        <div className="processing-step active">
                            <RotateCcw size={14} className="spin" /> Processing video...
                        </div>
                    )}
                </div>
            )}

            <div className="upload-actions">
                {isActive && (
                    <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                        Cancel
                    </button>
                )}
                {isError && (
                    <button className="btn btn-ghost btn-sm" onClick={onRetry}>
                        Retry
                    </button>
                )}
                {(isError || isSuccess || isCancelled) && (
                    <button className="btn btn-ghost btn-sm" onClick={onDismiss}>
                        Dismiss
                    </button>
                )}
            </div>
            
            {/* Visual part representation block */}
            {parts.length > 0 && (
                <div className="parts-visual-grid">
                    {parts.map(p => (
                        <div 
                            key={p.partNumber} 
                            className={`part-block ${p.status}`} 
                            title={`Part ${p.partNumber} - ${p.status}${p.retryCount > 0 ? ` (Attempt ${p.retryCount + 1})` : ''}`}
                        />
                    ))}
                </div>
            )}

            {isError && errorMessage && (
                <div className="upload-error-msg">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};
