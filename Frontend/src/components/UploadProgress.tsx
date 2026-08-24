import { CheckCircle, AlertCircle, X, RotateCcw, Loader2, Zap } from 'lucide-react';
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
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const STATE_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
    initializing: { icon: Loader2, label: 'Initializing…', color: 'var(--info)' },
    uploading: { icon: Zap, label: 'Uploading', color: 'var(--accent-primary)' },
    completing: { icon: Loader2, label: 'Completing…', color: 'var(--info)' },
    success: { icon: CheckCircle, label: 'Uploaded', color: 'var(--success)' },
    error: { icon: AlertCircle, label: 'Failed', color: 'var(--danger)' },
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
    onCancel,
    onRetry,
    onDismiss,
}: UploadProgressProps) => {
    const stateInfo = STATE_CONFIG[uploadState] || STATE_CONFIG.uploading;
    const Icon = stateInfo.icon;
    const isActive = uploadState === 'uploading' || uploadState === 'initializing' || uploadState === 'completing';
    const isError = uploadState === 'error';
    const isSuccess = uploadState === 'success';

    const activeParts = parts.filter(p => p.status === 'active').length;
    const doneParts = parts.filter(p => p.status === 'done').length;
    const failedParts = parts.filter(p => p.status === 'failed').length;

    return (
        <div className={`upload-progress ${isError ? 'upload-progress--error' : ''} ${isSuccess ? 'upload-progress--success' : ''}`}>
            <div className="upload-progress-header">
                <div className="upload-progress-status">
                    <Icon
                        size={16}
                        style={{ color: stateInfo.color }}
                        className={isActive ? 'upload-spin' : ''}
                    />
                    <span className="upload-progress-filename">
                        {filename}
                    </span>
                </div>
                <div className="upload-progress-actions">
                    <span className="upload-progress-percent" style={{ color: stateInfo.color }}>
                        {stateInfo.label} {isActive && `${progress}%`}
                    </span>
                    {isError && (
                        <button className="btn btn-sm btn-ghost upload-action-btn" onClick={onRetry} title="Retry failed parts">
                            <RotateCcw size={14} /> Retry
                        </button>
                    )}
                    {isActive && (
                        <button className="btn btn-sm btn-ghost upload-action-btn" onClick={onCancel} title="Cancel upload">
                            <X size={14} /> Cancel
                        </button>
                    )}
                    {(isError || isSuccess) && (
                        <button className="upload-dismiss-btn" onClick={onDismiss} title="Dismiss">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="upload-progress-bar">
                <div
                    className={`upload-progress-fill ${isError ? 'upload-progress-fill--error' : ''} ${isSuccess ? 'upload-progress-fill--success' : ''}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="upload-progress-details">
                <span>{formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}</span>
                {parts.length > 0 && (
                    <span>Parts: {doneParts}/{parts.length}{activeParts > 0 && ` (${activeParts} active)`}{failedParts > 0 && ` · ${failedParts} failed`}</span>
                )}
                {speedInfo && isActive && (
                    <span>{formatSpeed(speedInfo.bytesPerSecond)} · ETA {formatEta(speedInfo.etaSeconds)}</span>
                )}
            </div>

            {isError && errorMessage && (
                <div className="upload-progress-error">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};
