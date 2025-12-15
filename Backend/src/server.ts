import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './interface-adapters/middleware/errorMiddleware';
import { config } from './core/config/config';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));


import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './core/config/swagger';

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const MONGO_URI = config.mongo.uri;
console.log("Connecting to Mongo (Microservice)...");

mongoose.connect(MONGO_URI)
    .then(() => console.log("Video Microservice: MongoDB Connected"))
    .catch(err => console.error("Video Microservice: MongoDB Connection Error", err));

app.use('/api/v1', apiRoutes);

app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`Video Microservice running on port ${PORT}`);
});
