import { createApiClient } from './apiClient';
import { config } from '../config';
import type { User } from '../types';

const client = createApiClient(config.projectApiUrl);

export const registerUser = async (email: string, password: string, name: string) => {
    const { data } = await client.post<{ token: string; user: User }>('/auth/register', { email, password, name });
    return data;
};

export const loginUser = async (email: string, password: string) => {
    const { data } = await client.post<{ token: string; user: User }>('/auth/login', { email, password });
    return data;
};

export const getMe = async () => {
    const { data } = await client.get<{ user: User }>('/auth/me');
    return data.user;
};
