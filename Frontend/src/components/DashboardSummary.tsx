import type { VideoMeta } from '../types';
import { formatFileSize } from '../utils/format';
import { useAuth } from '../context/AuthContext';

interface DashboardSummaryProps {
    videos: VideoMeta[];
}

export const DashboardSummary = ({ videos }: DashboardSummaryProps) => {
    const { user } = useAuth();
    
    const totalVideos = videos.length;
    const totalStorage = videos.reduce((acc, v) => acc + (v.fileSize || 0), 0);
    const uploadedVideos = videos.filter(v => v.status === 'UPLOADED' || v.status === 'DONE').length;

    // A simple greeting based on time of day
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';

    const firstName = user?.name ? user.name.split(' ')[0] : 'there';

    return (
        <div className="dashboard-summary">
            <h2 className="summary-greeting">{greeting}, {firstName}</h2>
            <p className="summary-subtitle">Your media workspace</p>
            
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="summary-card-value">{totalVideos}</div>
                    <div className="summary-card-label">Videos</div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-value">{formatFileSize(totalStorage)}</div>
                    <div className="summary-card-label">Storage</div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-value">{uploadedVideos}</div>
                    <div className="summary-card-label">Uploaded</div>
                </div>
            </div>
            
            <h3 className="section-title">Recent uploads</h3>
        </div>
    );
};
