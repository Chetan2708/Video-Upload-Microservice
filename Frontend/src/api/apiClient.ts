import axios from 'axios';

/**
 * Decodes a JWT and checks if it's expired.
 * Returns true if the token is expired or invalid.
 */
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Add 30-second buffer to avoid edge cases
        return payload.exp * 1000 < Date.now() + 30000;
    } catch {
        return true;
    }
};

/**
 * Creates an Axios instance with the auth token interceptor.
 * Shared across all API modules to avoid duplicating interceptor logic.
 *
 * - Request interceptor: attaches JWT from localStorage, checks expiry
 * - Response interceptor: auto-logout on 401
 */
export const createApiClient = (baseURL: string) => {
    const client = axios.create({ baseURL });

    // ── Request interceptor: attach token, check expiry ──
    client.interceptors.request.use((cfg) => {
        const token = localStorage.getItem('token');
        if (token) {
            if (isTokenExpired(token)) {
                localStorage.removeItem('token');
                window.location.reload();
                return Promise.reject(new Error('Session expired'));
            }
            cfg.headers.Authorization = `Bearer ${token}`;
        }
        return cfg;
    });

    // ── Response interceptor: auto-logout on 401 ──
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                const token = localStorage.getItem('token');
                if (token) {
                    localStorage.removeItem('token');
                    window.location.reload();
                }
            }
            return Promise.reject(error);
        }
    );

    return client;
};
