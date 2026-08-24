import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    );
};
