import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/AppError';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.statusCode >= 500 ? 'error' : 'fail',
            message: err.message
        });
    }

    console.error('Unexpected Error:', err);

    return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error'
    });
};
