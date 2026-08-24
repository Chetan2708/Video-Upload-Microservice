import { createApiClient } from './apiClient';
import { config } from '../config';
import type { Project } from '../types';

const client = createApiClient(config.projectApiUrl);

export const getProjects = async () => {
    const { data } = await client.get<{ projects: Project[] }>('/projects');
    return data.projects;
};

export const createProject = async (name: string, description: string = '') => {
    const { data } = await client.post<{ project: Project }>('/projects', { name, description });
    return data.project;
};

export const deleteProject = async (id: string) => {
    await client.delete(`/projects/${id}`);
};

export const getProjectVideos = async (projectId: string) => {
    const { data } = await client.get<{ videos: string[] }>(`/projects/${projectId}/videos`);
    return data.videos;
};

export const addVideoToProject = async (projectId: string, videoId: string) => {
    await client.post(`/projects/${projectId}/videos`, { videoId });
};
