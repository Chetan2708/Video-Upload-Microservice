import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const requiredEnvVars = [
    'MONGO_URI',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME',
    'JWT_SECRET'
];

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`WARNING: Missing environment variable ${key}`);
    }
});

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5001', 10),
    jwtSecret: process.env.JWT_SECRET || 'default_secret',
    mongo: {
        uri: process.env.MONGO_URI || '',
    },
    aws: {
        region: process.env.AWS_REGION || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        bucketName: process.env.AWS_BUCKET_NAME || '',
    }
};
