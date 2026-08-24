import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import { config } from './config/config';
import { logger } from './utils/logger';
import { errorMiddleware } from './middlewares/errorMiddleware';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(pinoHttp({ logger: logger as any }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' }
});

app.use(limiter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.use(errorMiddleware as express.ErrorRequestHandler);

const startServer = async () => {
    try {
        logger.info('Connecting to MongoDB (Project Backend)...');
        await mongoose.connect(config.mongo.uri);
        logger.info('MongoDB Connected successfully');

        app.listen(config.port, () => {
            logger.info(`Project Backend running on port ${config.port}`);
        });

    } catch (error) {
        logger.error({ err: error }, 'Failed to start Project Backend');
        process.exit(1);
    }
};

startServer();
