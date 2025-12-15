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


app.get('/', (_req, res) => {
    res.status(200)
        .type('html')
        .send(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Video Microservice</title></head><body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem;">
<h1>Video Microservice is up</h1>
<p>Status: <strong>OK</strong></p>
</body></html>`);
});

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
