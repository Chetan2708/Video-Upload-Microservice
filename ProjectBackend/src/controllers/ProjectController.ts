import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { UnauthorizedError } from '../core/errors/AppError';

export class ProjectController {
    static async createProject(req: Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                throw new UnauthorizedError('Not authenticated');
            }

            const project = await Project.create({ name, userId });

            res.status(201).json({
                project: {
                    id: project._id,
                    name: project.name,
                    createdAt: project.createdAt
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getProjects(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new UnauthorizedError('Not authenticated');
            }

            const projects = await Project.find({ userId }).sort({ createdAt: -1 });

            res.status(200).json({
                projects: projects.map(p => ({
                    id: p._id,
                    name: p.name,
                    createdAt: p.createdAt
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    static async addVideoToProject(req: Request, res: Response, next: NextFunction) {
        try {
            const { projectId } = req.params;
            const { videoId } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                throw new UnauthorizedError('Not authenticated');
            }

            const project = await Project.findOneAndUpdate(
                { _id: projectId, userId },
                { $addToSet: { videos: videoId } },
                { new: true }
            );

            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }

            res.status(200).json({ message: "Video added to project successfully" });
        } catch (error) {
            next(error);
        }
    }

    static async getProjectVideos(req: Request, res: Response, next: NextFunction) {
        try {
            const { projectId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                throw new UnauthorizedError('Not authenticated');
            }

            const project = await Project.findOne({ _id: projectId, userId });

            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }

            res.status(200).json({ videos: project.videos });
        } catch (error) {
            next(error);
        }
    }
}
