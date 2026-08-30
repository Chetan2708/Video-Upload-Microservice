import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVideo, triggerTranscode } from '../api/videoApi';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import type { VideoWithUrl } from '../types';
import { formatFileSize } from '../utils/format';
import { FileVideo, HardDrive, UploadCloud, Calendar, ArrowLeft, Coins } from 'lucide-react';

export const VideoPage = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [video, setVideo] = useState<VideoWithUrl | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [transcodeState, setTranscodeState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [selectedQuality, setSelectedQuality] = useState<'original' | '720p'>('original');
    const { features } = useConfig();

    useEffect(() => {
        if (video) {
            if (video.mp4Url && selectedQuality === 'original' && video.status === 'DONE') {
                setSelectedQuality('720p');
            }
        }
    }, [video]);

    useEffect(() => {
        if (!videoId) return;

        let interval: ReturnType<typeof setInterval>;

        const loadVideo = async () => {
            try {
                const data = await getVideo(videoId);
                setVideo(data);

                // If it's processing, poll for updates
                if (data.status === 'PROCESSING' || transcodeState === 'success') {
                    interval = setInterval(async () => {
                        try {
                            const updated = await getVideo(videoId);
                            setVideo(updated);
                            if (updated.status !== 'PROCESSING') {
                                clearInterval(interval);
                            }
                        } catch (err) {
                            console.error('Failed to poll video status', err);
                        }
                    }, 5000);
                }
            } catch (err) {
                setError('Failed to load video details');
            } finally {
                setLoading(false);
            }
        };

        loadVideo();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [videoId, transcodeState]);

    const handleTranscode = async () => {
        if (!videoId) return;
        setTranscodeState('loading');
        try {
            await triggerTranscode(videoId);
            setTranscodeState('success');
            // Refresh video details to show new status
            const data = await getVideo(videoId);
            setVideo(data);
            // Refresh user to update credits
            await refreshUser();
        } catch (err) {
            setTranscodeState('error');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white gap-4">
                <div className="text-xl">⚠️ {error || 'Video not found'}</div>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
        );
    }

    const playUrl = selectedQuality === '720p' && video.mp4Url ? video.mp4Url : video.url;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Video Player */}
                    <div className="flex-grow lg:w-2/3">
                        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-2xl border border-gray-800">
                            {playUrl ? (
                                <video
                                    key={playUrl} /* Re-mount video when url changes to avoid stuck frames */
                                    src={playUrl}
                                    controls
                                    autoPlay={selectedQuality !== 'original' || video.status !== 'DONE'}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="text-4xl mb-4">⏳</div>
                                    <p className="text-lg">Video is not ready for playback yet.</p>
                                    <p className="text-sm mt-2 text-gray-500">Status: {video.status}</p>
                                </div>
                            )}
                        </div>

                        {video.mp4Url && (
                            <div className="flex items-center gap-3 mb-6 bg-gray-800/50 p-2 rounded-lg border border-gray-700 w-fit">
                                <span className="text-sm text-gray-400 pl-2">Quality:</span>
                                <div className="flex gap-1">
                                    <button
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedQuality === '720p' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-gray-700 text-gray-300'}`}
                                        onClick={() => setSelectedQuality('720p')}
                                    >
                                        720p Optimized
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedQuality === 'original' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-gray-700 text-gray-300'}`}
                                        onClick={() => setSelectedQuality('original')}
                                    >
                                        Original
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <FileVideo className="text-blue-500" />
                                {video.fileName}
                            </h1>
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1"><HardDrive size={16} /> {formatFileSize(video.fileSize)}</div>
                                <div className="flex items-center gap-1"><Calendar size={16} /> {new Date(video.createdAt).toLocaleDateString()}</div>
                                <div className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                                    Status: {video.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    {features?.transcodingEnabled &&
                        <div className="w-full lg:w-1/3">
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <UploadCloud size={20} className="text-purple-400" /> Actions
                                </h2>

                                <div className="space-y-4">
                                    {video.status === 'UPLOADED' && features?.transcodingEnabled && (
                                        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg relative overflow-hidden">
                                            {/* Credits Badge */}
                                            <div className="absolute top-0 right-0 bg-gray-900/80 px-3 py-1 rounded-bl-lg text-xs font-medium flex items-center gap-1 border-l border-b border-gray-700">
                                                <Coins size={12} className={user?.credits ? 'text-yellow-400' : 'text-gray-500'} />
                                                <span className={user?.credits ? 'text-gray-300' : 'text-red-400'}>
                                                    Credits: {user?.credits ?? 0}
                                                </span>
                                            </div>

                                            <h3 className="font-medium mb-2 pr-20">Transcode Video</h3>
                                            <p className="text-sm text-gray-400 mb-4">
                                                Convert this video to an optimized web format (720p MP4). This costs <span className="font-semibold text-yellow-400">1 credit</span>.
                                            </p>
                                            <button
                                                className={`w-full py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                                                    !user?.credits || user.credits < 1
                                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                                onClick={handleTranscode}
                                                disabled={transcodeState === 'loading' || !user?.credits || user.credits < 1}
                                            >
                                                {transcodeState === 'loading' ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (!user?.credits || user.credits < 1) ? (
                                                    'Out of Credits'
                                                ) : (
                                                    'Start Transcode Job'
                                                )}
                                            </button>
                                            {transcodeState === 'error' && <p className="text-red-400 text-xs mt-2">Failed to start transcode. Try again.</p>}
                                        </div>
                                    )}

                                    {video.status === 'PROCESSING' && (
                                        <div className="bg-gray-800 border border-blue-900/30 p-4 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                <div>
                                                    <h3 className="font-medium text-blue-400">Transcoding in progress...</h3>
                                                    <p className="text-xs text-gray-400 mt-1">This may take a few minutes depending on video size.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {video.status === 'DONE' && (
                                        <div className="bg-gray-800 border border-green-900/30 p-4 rounded-lg">
                                            <h3 className="font-medium text-green-400 mb-1">✓ Optimization Complete</h3>
                                            <p className="text-xs text-gray-400">This video has been successfully transcoded and is ready for playback.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};
