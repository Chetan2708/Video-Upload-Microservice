import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import cron from 'node-cron';
import apiRoutes from './routes/api.routes';
import { errorMiddleware } from './interface-adapters/middleware/errorMiddleware';
import { config } from './core/config/config';
import { authMiddleware } from './interface-adapters/middleware/authMiddleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './core/config/swagger';
import { ServiceContainer } from './core/di/ServiceContainer';
import { logger } from './core/utils/logger';

const app = express();

app.use(express.json());
// CORS should ideally be restricted on production
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', (req, res) => {
    const isDbReady = mongoose.connection.readyState === 1;
    if (isDbReady) {
        res.status(200).json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not_ready', dbState: mongoose.connection.readyState });
    }
});

app.get('/', (req, res) => {
    res.redirect('/docs');
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', authMiddleware, apiRoutes);

app.use(errorMiddleware);

const startServer = async () => {
    try {
        const MONGO_URI = config.mongo.uri;
        logger.info("Connecting to Mongo (Microservice)...");

        await mongoose.connect(MONGO_URI);
        logger.info("Video Microservice: MongoDB Connected");

        logger.info("Initializing Services using Container...");
        const services = ServiceContainer.getInstance();
        const cleanupService = services.cleanupService;

        cron.schedule('*/15 * * * *', () => {
            cleanupService.cleanupStaleUploads();
        });
        logger.info("Cleanup Cron Job scheduled (every 15 mins).");

        const PORT = config.port;

        const server = app.listen(PORT, () => {
            logger.info(`Video Microservice running on port ${PORT}`);
        });

        const shutdown = async (signal: string) => {
            logger.info(`${signal} received: closing HTTP server`);
            server.close(async () => {
                logger.info('HTTP server closed');
                try {
                    await mongoose.connection.close(false);
                    logger.info('Mongo connection closed');
                    process.exit(0);
                } catch (err) {
                    logger.error({ err }, 'Error during Mongo connection closure');
                    process.exit(1);
                }
            });

            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (err) {
        logger.error({ err }, "Failed to start server");
        process.exit(1);
    }
};

startServer();
