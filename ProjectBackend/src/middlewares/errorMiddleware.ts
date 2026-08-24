import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/AppError';
import { logger } from '../utils/logger';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        const appErr = err as AppError;
        logger.warn(`[AppError] ${appErr.statusCode} - ${appErr.message}`);
        res.status(appErr.statusCode).json({
            status: 'error',
            error: appErr.message
        });
        return;
    }

    logger.error({ stack: err.stack }, `[UnhandledError] ${err.message}`);
    res.status(500).json({
        status: 'error',
        error: 'Internal Server Error'
    });
};
