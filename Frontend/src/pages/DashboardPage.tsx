import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useVideos } from '../hooks/useVideos';
import { useUpload } from '../hooks/useUpload';

import { Sidebar } from '../components/Sidebar';
import { EmptyState } from '../components/EmptyState';
import { UploadProgress } from '../components/UploadProgress';
import { UploadZone } from '../components/UploadZone';
import { VideoGrid } from '../components/VideoGrid';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { VideoPlayerModal } from '../components/VideoPlayerModal';

export const DashboardPage = () => {
    const { user, logout } = useAuth();
    
    // Project state & operations
    const { projects, selectedProject, selectProject, createProject, deleteProject } = useProjects();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Video list & player
    const { videos, loading: loadingVideos, playingVideo, loadVideos, playVideo, closePlayer } = useVideos(selectedProject?.id || null);

    // Upload logic
    const {
        uploading, uploadProgress, uploadFileName, dragging, fileInputRef,
        handleFileSelect, handleDrop, setDragging, openFilePicker
    } = useUpload(selectedProject?.id || null, loadVideos);

    const handleCreateProject = async (name: string, description: string) => {
        await createProject(name, description);
        setShowCreateModal(false);
    };

    return (
        <div className="app-layout">
            <Sidebar
                projects={projects}
                selectedProject={selectedProject}
                user={user}
                onSelectProject={selectProject}
                onDeleteProject={deleteProject}
                onCreateProject={() => setShowCreateModal(true)}
                onLogout={logout}
            />

            <main className="main-content">
                {!selectedProject ? (
                    <EmptyState
                        icon="📹"
                        title="Select a project"
                        description="Choose a project from the sidebar or create a new one to get started"
                        action={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Project</button>}
                    />
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

                        {uploading && (
                            <UploadProgress filename={uploadFileName} progress={uploadProgress} />
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

                        {loadingVideos ? (
                            <div className="center-spinner">
                                <div className="spinner" />
                            </div>
                        ) : videos.length === 0 ? (
                            <EmptyState
                                icon="🎬"
                                title="No videos yet"
                                description="Upload your first video to this project"
                            />
                        ) : (
                            <VideoGrid videos={videos} onPlayVideo={playVideo} />
                        )}
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
                <VideoPlayerModal video={playingVideo} onClose={closePlayer} />
            )}
        </div>
    );
};
