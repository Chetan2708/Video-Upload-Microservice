import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

let toastCounter = 0;

const ICONS: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: 'var(--success)',
    },
    error: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.25)',
        icon: 'var(--danger)',
    },
    info: {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.25)',
        icon: 'var(--info)',
    },
    warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.25)',
        icon: 'var(--warning)',
    },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastCounter}`;
        const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
        setToasts(prev => [...prev, { ...toast, id }]);
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(toast => {
                        const Icon = ICONS[toast.type];
                        const colors = COLORS[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                className="toast"
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                style={{
                                    background: colors.bg,
                                    borderColor: colors.border,
                                }}
                            >
                                <Icon
                                    size={18}
                                    style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }}
                                />
                                <div className="toast-body">
                                    <div className="toast-title">{toast.title}</div>
                                    {toast.message && (
                                        <div className="toast-message">{toast.message}</div>
                                    )}
                                </div>
                                <button
                                    className="toast-close"
                                    onClick={() => removeToast(toast.id)}
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
