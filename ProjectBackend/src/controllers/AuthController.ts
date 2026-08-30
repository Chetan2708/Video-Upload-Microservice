import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/config';
import { ConflictError, UnauthorizedError, NotFoundError } from '../core/errors/AppError';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new ConflictError('User with this email already exists');
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const user = await User.create({ email, passwordHash, name });

            const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' });

            res.status(201).json({
                user: { id: user._id, email: user.email, name: user.name, credits: user.credits },
                token
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                throw new UnauthorizedError('Invalid credentials');
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                throw new UnauthorizedError('Invalid credentials');
            }

            const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' });

            res.status(200).json({
                user: { id: user._id, email: user.email, name: user.name, credits: user.credits },
                token
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Not authenticated');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            res.status(200).json({
                user: { id: user._id, email: user.email, name: user.name, credits: user.credits }
            });
        } catch (error) {
            next(error);
        }
    }
}
