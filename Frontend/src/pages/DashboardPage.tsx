import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useVideos } from '../hooks/useVideos';
import { useUpload } from '../hooks/useUpload';
import { useIsMobile } from '../hooks/use-mobile';
import { addUploadHistoryEntry } from '../components/UploadHistory';

import { Sidebar } from '../components/Sidebar';
import { EmptyState } from '../components/EmptyState';
import { UploadProgress } from '../components/UploadProgress';
import { UploadZone } from '../components/UploadZone';
import { VideoGrid } from '../components/VideoGrid';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { VideoDetailsPanel } from '../components/VideoDetailsPanel';
import { DashboardSummary } from '../components/DashboardSummary';
import { UploadHistory } from '../components/UploadHistory';
import { ArchitecturePanel } from '../components/ArchitecturePanel';

import { Menu, Search, Video } from 'lucide-react';
import type { VideoMeta, VideoWithUrl } from '../types';

type SortOption = 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc';
type StatusFilter = 'all' | 'UPLOADED' | 'DONE' | 'PROCESSING' | 'FAILED';

const STATUS_FILTERS: StatusFilter[] = ['all', 'UPLOADED', 'DONE', 'PROCESSING', 'FAILED'];

export const DashboardPage = () => {
    const { user, logout } = useAuth();
    const isMobile = useIsMobile();

    // Project state & operations
    const { projects, selectedProject, selectProject, createProject, deleteProject, loading: loadingProjects, error: projectsError, retryLoadProjects } = useProjects();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Video list & player
    const { videos, loading: loadingVideos, error: videosError, playingVideo, loadVideos, playVideo, closePlayer, retryLoadVideos } = useVideos(selectedProject?.id || null);

    // Upload logic
    const {
        uploadState, uploadProgress, uploadFileName, uploadedBytes, totalBytes,
        parts, speedInfo, errorMessage, maxConcurrency, dragging, fileInputRef,
        handleFileSelect, handleDrop, setDragging, openFilePicker,
        cancelUpload, retryUpload, clearError,
    } = useUpload(selectedProject?.id || null, async (projectId: string) => {
        await loadVideos(projectId);
        // Save to upload history on success
        addUploadHistoryEntry({
            id: Date.now().toString(),
            fileName: uploadFileName,
            fileSize: totalBytes,
            status: 'success',
            date: new Date().toISOString(),
        });
    });

    // Mobile sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // View state
    const [showArchitecture, setShowArchitecture] = useState(false);

    // Video details drawer
    const [detailsVideo, setDetailsVideo] = useState<VideoWithUrl | null>(null);

    // Search / Sort / Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredAndSortedVideos = useMemo(() => {
        let result = [...videos];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(v => v.fileName.toLowerCase().includes(q));
        }

        // Filter
        if (statusFilter !== 'all') {
            result = result.filter(v => v.status === statusFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'size-desc': return b.fileSize - a.fileSize;
                case 'size-asc': return a.fileSize - b.fileSize;
                case 'name-asc': return a.fileName.localeCompare(b.fileName);
                case 'name-desc': return b.fileName.localeCompare(a.fileName);
                default: return 0;
            }
        });

        return result;
    }, [videos, searchQuery, sortBy, statusFilter]);

    const handleCreateProject = async (name: string, description: string) => {
        await createProject(name, description);
        setShowCreateModal(false);
    };

    const handleVideoDetails = async (videoId: string) => {
        // Find video in current list or fetch it
        const vid = videos.find(v => v.videoId === videoId);
        if (vid) {
            setDetailsVideo(vid as VideoWithUrl);
        }
    };

    const isUploading = uploadState !== 'idle';

    return (
        <div className="app-layout">
            {/* Mobile header */}
            {isMobile && (
                <div className="mobile-header">
                    <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="mobile-header-logo">
                        <Video size={18} />
                        VideoDash
                    </div>
                    <div style={{ width: 36 }} /> {/* Spacer for centering */}
                </div>
            )}

            {/* Sidebar */}
            {isMobile ? (
                <Sidebar
                    projects={projects}
                    selectedProject={selectedProject}
                    user={user}
                    onSelectProject={selectProject}
                    onDeleteProject={deleteProject}
                    onCreateProject={() => { setShowCreateModal(true); setSidebarOpen(false); }}
                    onLogout={logout}
                    onShowArchitecture={() => setShowArchitecture(true)}
                    isMobile={sidebarOpen}
                    onCloseMobile={() => setSidebarOpen(false)}
                />
            ) : (
                <Sidebar
                    projects={projects}
                    selectedProject={selectedProject}
                    user={user}
                    onSelectProject={(p) => { selectProject(p); setShowArchitecture(false); }}
                    onDeleteProject={deleteProject}
                    onCreateProject={() => setShowCreateModal(true)}
                    onLogout={logout}
                    onShowArchitecture={() => setShowArchitecture(true)}
                />
            )}

            <main className="main-content">
                {showArchitecture ? (
                    <ArchitecturePanel />
                ) : !selectedProject ? (
                    loadingProjects ? (
                        <div className="center-spinner">
                            <div className="spinner" />
                        </div>
                    ) : projectsError ? (
                        <EmptyState
                            icon="⚠️"
                            title="Failed to load projects"
                            description={projectsError}
                            variant="error"
                            action={<button className="btn btn-primary" onClick={retryLoadProjects}>Retry</button>}
                        />
                    ) : (
                        <EmptyState
                            icon="📹"
                            title="Select a project"
                            description="Choose a project from the sidebar or create a new one to get started"
                            action={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Project</button>}
                        />
                    )
                ) : (
                    <>
                        <div className="main-header">
                            <div>
                                <h2 className="main-title">{selectedProject.name}</h2>
                                {selectedProject.description && (
                                    <p className="main-subtitle">{selectedProject.description}</p>
                                )}
                            </div>
                        </div>

                        {isUploading && (
                            <UploadProgress
                                filename={uploadFileName}
                                progress={uploadProgress}
                                uploadState={uploadState}
                                uploadedBytes={uploadedBytes}
                                totalBytes={totalBytes}
                                parts={parts}
                                speedInfo={speedInfo}
                                errorMessage={errorMessage}
                                maxConcurrency={maxConcurrency}
                                onCancel={cancelUpload}
                                onRetry={retryUpload}
                                onDismiss={clearError}
                            />
                        )}

                        <UploadZone
                            dragging={dragging}
                            fileInputRef={fileInputRef}
                            onClick={openFilePicker}
                            onSelectFile={handleFileSelect}
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                        />

                        {/* Search / Sort / Filter toolbar */}
                        {videos.length > 0 && (
                            <>
                                <DashboardSummary videos={videos} />
                                <div className="toolbar">
                                <div className="search-wrapper">
                                    <Search size={14} className="search-icon" />
                                    <input
                                        className="search-input"
                                        placeholder="Search videos..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="sort-select"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as SortOption)}
                                >
                                    <option value="date-desc">Newest first</option>
                                    <option value="date-asc">Oldest first</option>
                                    <option value="size-desc">Largest first</option>
                                    <option value="size-asc">Smallest first</option>
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                </select>
                                <div className="filter-chips">
                                    {STATUS_FILTERS.map(status => (
                                        <button
                                            key={status}
                                            className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                                            onClick={() => setStatusFilter(status)}
                                        >
                                            {status === 'all' ? 'All' : status}
                                        </button>
                                    ))}
                                </div>
                                </div>
                            </>
                        )}

                        {loadingVideos ? (
                            <div className="center-spinner">
                                <div className="spinner" />
                            </div>
                        ) : videosError ? (
                            <EmptyState
                                icon="⚠️"
                                title="Failed to load videos"
                                description={videosError}
                                variant="error"
                                action={<button className="btn btn-primary" onClick={() => retryLoadVideos(selectedProject.id)}>Retry</button>}
                            />
                        ) : filteredAndSortedVideos.length === 0 ? (
                            videos.length > 0 ? (
                                <EmptyState
                                    icon="🔍"
                                    title="No matching videos"
                                    description="Try adjusting your search or filter"
                                    action={<button className="btn btn-ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>Clear filters</button>}
                                />
                            ) : (
                                <EmptyState
                                    icon="🎬"
                                    title="No videos yet"
                                    description="Upload your first video to this project"
                                />
                            )
                        ) : (
                            <VideoGrid
                                videos={filteredAndSortedVideos}
                                onPlayVideo={playVideo}
                                onVideoDetails={handleVideoDetails}
                            />
                        )}

                        <UploadHistory onPlayVideo={playVideo} />
                    </>
                )}
            </main>

            {showCreateModal && (
                <CreateProjectModal
                    onCreate={handleCreateProject}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {playingVideo && (
                <VideoDetailsPanel video={playingVideo} onClose={closePlayer} />
            )}

            {detailsVideo && !playingVideo && (
                <VideoDetailsPanel
                    video={detailsVideo}
                    onClose={() => setDetailsVideo(null)}
                />
            )}
        </div>
    );
};
