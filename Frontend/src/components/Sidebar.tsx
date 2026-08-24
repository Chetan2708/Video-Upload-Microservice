import type { Project, User } from '../types';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Folder, LogOut, Plus, Trash2, Video, Info } from 'lucide-react';

interface SidebarProps {
    projects: Project[];
    selectedProject: Project | null;
    user: User | null;
    onSelectProject: (project: Project) => void;
    onDeleteProject: (id: string, e: React.MouseEvent) => void;
    onCreateProject: () => void;
    onLogout: () => void;
    onShowArchitecture?: () => void;
    isMobile?: boolean;
    onCloseMobile?: () => void;
}

const SidebarContent = ({
    projects,
    selectedProject,
    user,
    onSelectProject,
    onDeleteProject,
    onCreateProject,
    onLogout,
    onShowArchitecture,
    onCloseMobile,
}: SidebarProps) => {
    const handleProjectClick = (project: Project) => {
        onSelectProject(project);
        onCloseMobile?.();
    };

    return (
        <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col text-slate-200">
            <div className="p-4 flex items-center gap-2 text-xl font-bold border-b border-slate-800">
                <Video className="w-6 h-6 text-indigo-500" />
                <span>VideoDash</span>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                <div className="flex items-center justify-between mb-8 px-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateProject}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-3">
                    {projects.map(project => {
                        const isActive = selectedProject?.id === project.id;
                        return (
                            <Button
                                key={project.id}
                                variant={isActive ? "secondary" : "ghost"}
                                className={`w-full justify-start h-11 ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}
                                onClick={() => handleProjectClick(project)}
                            >
                                <Folder className="mr-3 w-5 h-5 text-yellow-400 fill-yellow-400" />
                                <span className="flex-1 text-left truncate text-sm">{project.name}</span>
                                <div
                                    className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400 p-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteProject(project.id, e);
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </div>
                            </Button>
                        );
                    })}
                </div>
            </ScrollArea>

            {onShowArchitecture && (
                <>
                    <Separator className="bg-slate-800" />
                    <div className="px-3 py-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-10 hover:bg-slate-800 text-slate-400"
                            onClick={() => { onShowArchitecture(); onCloseMobile?.(); }}
                        >
                            <Info className="mr-3 w-4 h-4" />
                            <span className="text-sm">How It Works</span>
                        </Button>
                    </div>
                </>
            )}

            <Separator className="bg-slate-800" />

            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.name}</span>
                        <span className="text-xs text-slate-400 truncate w-32">{user?.email}</span>
                    </div>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-800 hover:text-white h-9 w-9">
                        <LogOut className="w-4 h-4 text-slate-400" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Ready to leave?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                                You are about to log out of VideoDash. You will need to sign in again to access your projects.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white">Log out</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </aside>
    );
};

export const Sidebar = (props: SidebarProps) => {
    const { isMobile, onCloseMobile } = props;

    // On mobile, render inside a drawer wrapper
    if (isMobile) {
        return (
            <div className={`sidebar-mobile-wrapper ${props.isMobile ? 'open' : ''}`}>
                <div className="sidebar-overlay" onClick={onCloseMobile} />
                <div className="sidebar-drawer">
                    <SidebarContent {...props} />
                </div>
            </div>
        );
    }

    return <SidebarContent {...props} />;
};
