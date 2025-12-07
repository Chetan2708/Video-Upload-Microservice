
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import apiRoutes from './routes/api.routes';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "";
console.log("Connecting to Mongo (Microservice)...");

mongoose.connect(MONGO_URI)
    .then(() => console.log("Video Microservice: MongoDB Connected"))
    .catch(err => console.error("Video Microservice: MongoDB Connection Error", err));

// Routes
app.use('/api/v1', apiRoutes);

const PORT = 5001; // Specific port for this microservice

app.listen(PORT, () => {
    console.log(`Video Microservice running on port ${PORT}`);
});
