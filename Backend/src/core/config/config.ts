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
    },
    mediaConvert: {
        endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT || '',
        roleArn: process.env.AWS_MEDIACONVERT_ROLE_ARN || '',
        /** Defaults to the same bucket used for uploads. */
        outputBucket: process.env.AWS_MEDIACONVERT_OUTPUT_BUCKET || process.env.AWS_BUCKET_NAME || '',
    },
    features: {
        transcodingEnabled: process.env.ENABLE_TRANSCODING !== 'false',
    }
};
