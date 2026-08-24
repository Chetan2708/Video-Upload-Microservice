import { useState, useEffect, useCallback } from 'react';
import * as projectApi from '../api/projectApi';
import type { Project } from '../types';

interface UseProjectsReturn {
    projects: Project[];
    selectedProject: Project | null;
    loading: boolean;
    error: string | null;
    selectProject: (project: Project) => void;
    createProject: (name: string, description: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    retryLoadProjects: () => void;
}

export const useProjects = (): UseProjectsReturn => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProjects = useCallback(() => {
        setLoading(true);
        setError(null);
        projectApi.getProjects()
            .then(setProjects)
            .catch(err => {
                console.error(err);
                setError(err instanceof Error ? err.message : 'Failed to load projects');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const selectProject = useCallback((project: Project) => {
        setSelectedProject(project);
    }, []);

    const createProject = useCallback(async (name: string, description: string) => {
        const project = await projectApi.createProject(name, description);
        setProjects(prev => [project, ...prev]);
        setSelectedProject(project);
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        await projectApi.deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        setSelectedProject(prev => (prev?.id === id ? null : prev));
    }, []);

    return { projects, selectedProject, loading, error, selectProject, createProject, deleteProject, retryLoadProjects: loadProjects };
};
