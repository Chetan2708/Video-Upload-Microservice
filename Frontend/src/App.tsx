import { useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VideoPage } from './pages/VideoPage';
import { config } from './config';

function App() {
    const { user, loading } = useAuth();
    const { addToast } = useToast();
    const hasPinged = useRef(false);

    useEffect(() => {
        if (hasPinged.current) return;
        hasPinged.current = true;

        const startTime = Date.now();
        
        // Setup a timeout to show the toast if it takes more than 1.5 seconds
        const timeoutId = setTimeout(() => {
            addToast({
                type: 'info',
                title: 'Backend is waking up',
                message: 'Since this is hosted on a free Render tier, it might take ~30 seconds to wake up from a cold boot. Hang tight!',
                duration: 10000,
            });
        }, 1500);

        // Ping the API to wake it up
        const baseUrl = config.projectApiUrl.replace(/\/api.*$/, '');
        fetch(`${baseUrl}/health`)
            .then(() => {
                const duration = Date.now() - startTime;
                if (duration < 1500) {
                    clearTimeout(timeoutId); // Backend was fast, cancel toast
                }
            })
            .catch(() => {
                // If it fails, maybe the endpoint doesn't exist or cors, but it still wakes it up
                clearTimeout(timeoutId);
            });

        return () => clearTimeout(timeoutId);
    }, [addToast]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/videos/:videoId" element={<VideoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
