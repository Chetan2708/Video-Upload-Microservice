import { Router } from 'express';
import { body } from 'express-validator';
import { ProjectController } from '../controllers/ProjectController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const validate = (validations: any[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        res.status(400).json({ status: 'error', error: 'Validation failed', details: errors.array() });
    };
};

const router = Router();

router.use(authMiddleware);

router.post('/', validate([
    body('name').notEmpty().withMessage('Project name is required')
]), ProjectController.createProject);

router.get('/', ProjectController.getProjects);

router.post('/:projectId/videos', validate([
    body('videoId').notEmpty().withMessage('Video ID is required')
]), ProjectController.addVideoToProject);

router.get('/:projectId/videos', ProjectController.getProjectVideos);

export default router;
