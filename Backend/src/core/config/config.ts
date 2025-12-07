import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const requiredEnvVars = [
    'MONGO_URI',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME'
];

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`WARNING: Missing environment variable ${key}`);
    }
});

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5001', 10),
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
