import 'dotenv/config';

export const config = {
    port: process.env.PORT || 4000,
    mongo: {
        uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project_backend'
    },
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret_for_dev',
    corsOrigin: process.env.CORS_ORIGIN || '*'
};
