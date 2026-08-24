import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../core/errors/AppError';

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

router.post('/register', validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required')
]), AuthController.register);

router.post('/login', validate([
    body('email').isEmail(),
    body('password').notEmpty()
]), AuthController.login);

router.get('/me', authMiddleware, AuthController.getMe);

export default router;
