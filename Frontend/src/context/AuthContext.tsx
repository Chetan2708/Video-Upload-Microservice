import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginUser, registerUser, getMe } from '../api/authApi';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            getMe()
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            const data = await loginUser(email, password);
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
        } catch (err: unknown) {
            const message =
                err instanceof Error && 'response' in err
                    ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                    : undefined;
            setError(message || 'Login failed');
            throw err;
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            setError(null);
            const data = await registerUser(email, password, name);
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
        } catch (err: unknown) {
            const message =
                err instanceof Error && 'response' in err
                    ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                    : undefined;
            setError(message || 'Registration failed');
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, error, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};
