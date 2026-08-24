import { useState } from 'react';
import { ChevronDown, ChevronRight, Upload, Shield, Database, Globe, Server, Layers } from 'lucide-react';

interface Section {
    icon: typeof Upload;
    title: string;
    content: { step: number; text: string }[];
}

const SECTIONS: Section[] = [
    {
        icon: Upload,
        title: 'Multipart Upload Flow',
        content: [
            { step: 1, text: 'Client requests upload initialization from the Video API with file metadata (name, size, type).' },
            { step: 2, text: 'API creates a MongoDB video record and initiates an S3 multipart upload, returning a videoId and uploadId.' },
            { step: 3, text: 'For each 5 MB chunk, the client requests a presigned PUT URL from the API.' },
            { step: 4, text: 'Client uploads each chunk directly to S3 using the presigned URL — bytes never pass through the API server.' },
            { step: 5, text: 'After each chunk upload, the client sends the ETag back to confirm the part.' },
            { step: 6, text: 'Up to 3 chunks upload concurrently with automatic retry on failure.' },
            { step: 7, text: 'Once all parts are confirmed, the client calls complete — the API finalizes the S3 multipart upload.' },
        ],
    },
    {
        icon: Shield,
        title: 'Authentication & JWT',
        content: [
            { step: 1, text: 'Users register or log in through the Project API, which returns a 7-day JWT.' },
            { step: 2, text: 'The JWT is stored in localStorage and attached to every API request via an Axios interceptor.' },
            { step: 3, text: 'Both the Project API and Video API verify the same JWT secret to authenticate requests.' },
            { step: 4, text: 'On 401 responses, the client auto-logs out and redirects to the login page.' },
        ],
    },
    {
        icon: Database,
        title: 'Storage Architecture',
        content: [
            { step: 1, text: 'Video metadata (ownership, status, ETags, S3 keys) is stored in MongoDB.' },
            { step: 2, text: 'Actual video bytes are stored in Amazon S3 using presigned URLs for direct browser upload.' },
            { step: 3, text: 'Playback uses presigned GET URLs generated on demand — no proxy needed.' },
            { step: 4, text: 'A cron job runs every 15 minutes to clean up stale/abandoned uploads in the database.' },
        ],
    },
    {
        icon: Server,
        title: 'API Architecture',
        content: [
            { step: 1, text: 'Two separate Express 5 APIs: Project Backend (port 4000) and Video Backend (port 5001).' },
            { step: 2, text: 'Project Backend handles registration, login, project CRUD, and project-video associations.' },
            { step: 3, text: 'Video Backend handles upload lifecycle, video metadata, presigned URLs, and Swagger docs.' },
            { step: 4, text: 'Both use Helmet, CORS, rate limiting, Pino logging, and graceful shutdown.' },
        ],
    },
    {
        icon: Globe,
        title: 'Presigned URLs',
        content: [
            { step: 1, text: 'Presigned URLs are temporary S3 URLs that allow direct browser-to-S3 communication.' },
            { step: 2, text: 'For uploads, the API generates presigned PUT URLs so the browser can upload chunks directly.' },
            { step: 3, text: 'For playback, the API generates presigned GET URLs so the browser can stream the video.' },
            { step: 4, text: 'This architecture eliminates the API server as a bottleneck for large file transfers.' },
        ],
    },
    {
        icon: Layers,
        title: 'TypeScript SDK',
        content: [
            { step: 1, text: 'The SDK provides UploadClient and VideoClient for programmatic access.' },
            { step: 2, text: 'UploadClient handles chunking, concurrency, retries, and progress reporting.' },
            { step: 3, text: 'VideoClient provides methods for fetching video metadata and presigned playback URLs.' },
            { step: 4, text: 'Both clients accept a bearer token and base URL for authentication.' },
        ],
    },
];

export const ArchitecturePanel = () => {
    const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

    const toggleSection = (index: number) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    return (
        <div className="arch-panel">
            <div style={{ marginBottom: 24 }}>
                <h2 className="main-title" style={{ marginBottom: 8 }}>How It Works</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    This dashboard is powered by a multipart upload architecture where video bytes flow directly from your browser to Amazon S3,
                    while the API servers coordinate metadata, authentication, and lifecycle management.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    API documentation is available at{' '}
                    <a href={import.meta.env.VITE_VIDEO_API_URL + '/docs'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                        docs
                    </a>
                </p>
            </div>

            {SECTIONS.map((section, index) => {
                const Icon = section.icon;
                const isOpen = openSections.has(index);
                return (
                    <div key={index} className="arch-section">
                        <div className="arch-section-header" onClick={() => toggleSection(index)}>
                            <Icon size={18} style={{ color: 'var(--accent-primary)' }} />
                            <span className="arch-section-title">{section.title}</span>
                            {isOpen ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                        {isOpen && (
                            <div className="arch-section-body">
                                {section.content.map(item => (
                                    <div key={item.step} className="arch-step">
                                        <div className="arch-step-num">{item.step}</div>
                                        <div className="arch-step-text">{item.text}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
