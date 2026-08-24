import { useState } from 'react';

interface CreateProjectModalProps {
    onCreate: (name: string, description: string) => void;
    onClose: () => void;
}

export const CreateProjectModal = ({ onCreate, onClose }: CreateProjectModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name, description);
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal" onClick={e => e.stopPropagation()}>
                <h2>New Project</h2>
                <label htmlFor="project-name">Project Name</label>
                <input
                    id="project-name"
                    className="input"
                    placeholder="My Awesome Project"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <label htmlFor="project-desc">Description (optional)</label>
                <input
                    id="project-desc"
                    className="input"
                    placeholder="A brief description..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <div className="create-modal-actions">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreate}>Create Project</button>
                </div>
            </div>
        </div>
    );
};
