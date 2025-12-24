import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import cron from 'node-cron';
import apiRoutes from './routes/api.routes';
import { errorMiddleware } from './interface-adapters/middleware/errorMiddleware';
import { config } from './core/config/config';
import { authMiddleware } from './interface-adapters/middleware/authMiddleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './core/config/swagger';
import { ServiceContainer } from './core/di/ServiceContainer';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));



app.get('/', (req, res) => {
    res.redirect('/docs');
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const MONGO_URI = config.mongo.uri;
console.log("Connecting to Mongo (Microservice)...");

mongoose.connect(MONGO_URI)
    .then(() => console.log("Video Microservice: MongoDB Connected"))
    .catch(err => console.error("Video Microservice: MongoDB Connection Error", err));

app.use('/api/v1', authMiddleware, apiRoutes);

app.use(errorMiddleware);

// --- Background Jobs ---

console.log("Initializing Services using Container...");
const services = ServiceContainer.getInstance();
const cleanupService = services.cleanupService;

cron.schedule('*/15 * * * *', () => {
    cleanupService.cleanupStaleUploads();
});
console.log("Cleanup Cron Job scheduled (every 15 mins).");

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`Video Microservice running on port ${PORT}`);
});
