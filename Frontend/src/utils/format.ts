/**
 * Format a byte count into a human-readable string (e.g. "1.5 MB").
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format an ISO date string into a short readable format (e.g. "Mar 7, 2026").
 */
export const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/** Video MIME types accepted by the upload zone. */
export const ACCEPTED_VIDEO_TYPES = 'video/*';

/** Human-readable list of supported video formats. */
export const SUPPORTED_FORMATS_LABEL = 'Supports MP4, MOV, AVI, WebM';
