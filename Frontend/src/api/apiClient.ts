import axios from 'axios';

/**
 * Creates an Axios instance with the auth token interceptor.
 * Shared across all API modules to avoid duplicating interceptor logic.
 */
export const createApiClient = (baseURL: string) => {
    const client = axios.create({ baseURL });

    client.interceptors.request.use((cfg) => {
        const token = localStorage.getItem('token');
        if (token) {
            cfg.headers.Authorization = `Bearer ${token}`;
        }
        return cfg;
    });

    return client;
};
