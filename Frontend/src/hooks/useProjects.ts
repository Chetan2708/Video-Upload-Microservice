import { useState, useEffect, useCallback } from 'react';
import * as projectApi from '../api/projectApi';
import type { Project } from '../types';

interface UseProjectsReturn {
    projects: Project[];
    selectedProject: Project | null;
    selectProject: (project: Project) => void;
    createProject: (name: string, description: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        projectApi.getProjects().then(setProjects).catch(console.error);
    }, []);

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

    return { projects, selectedProject, selectProject, createProject, deleteProject };
};
