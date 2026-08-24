import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
    variant?: 'empty' | 'error' | 'loading';
}

export const EmptyState = ({ icon, title, description, action, variant = 'empty' }: EmptyStateProps) => {
    return (
        <div className={`empty-state ${variant === 'error' ? 'empty-state--error' : ''}`}>
            <div className="empty-state-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    );
};
