import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Ban, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/format';

export interface UploadHistoryEntry {
    id: string;
    fileName: string;
    fileSize: number;
    status: 'success' | 'failed' | 'cancelled';
    date: string;
    videoId?: string;
}

const STORAGE_KEY = 'upload_history';
const MAX_ENTRIES = 20;

export const getUploadHistory = (): UploadHistoryEntry[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

export const addUploadHistoryEntry = (entry: UploadHistoryEntry) => {
    const history = getUploadHistory();
    history.unshift(entry);
    if (history.length > MAX_ENTRIES) history.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

const STATUS_ICONS = {
    success: CheckCircle,
    failed: XCircle,
    cancelled: Ban,
};

const STATUS_COLORS = {
    success: 'var(--success)',
    failed: 'var(--danger)',
    cancelled: 'var(--text-muted)',
};

interface UploadHistoryProps {
    onPlayVideo?: (videoId: string) => void;
}

export const UploadHistory = ({ onPlayVideo }: UploadHistoryProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [entries, setEntries] = useState<UploadHistoryEntry[]>([]);

    useEffect(() => {
        setEntries(getUploadHistory());
    }, [isOpen]);

    if (entries.length === 0) return null;

    return (
        <div className="upload-history">
            <button className="upload-history-toggle" onClick={() => setIsOpen(!isOpen)}>
                <Clock size={14} />
                <span style={{ flex: 1, textAlign: 'left' }}>Recent Uploads ({entries.length})</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="upload-history-list">
                    {entries.map(entry => {
                        const Icon = STATUS_ICONS[entry.status];
                        return (
                            <div
                                key={entry.id}
                                className="upload-history-item"
                                onClick={() => entry.videoId && entry.status === 'success' && onPlayVideo?.(entry.videoId)}
                                style={{ cursor: entry.status === 'success' && entry.videoId ? 'pointer' : 'default' }}
                            >
                                <Icon size={14} style={{ color: STATUS_COLORS[entry.status], flexShrink: 0 }} />
                                <span className="upload-history-name">{entry.fileName}</span>
                                <span className="upload-history-meta">
                                    {formatFileSize(entry.fileSize)} · {formatDate(entry.date)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
