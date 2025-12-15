import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const port = config.port;
const url = process.env.SERVER_URL || `http://localhost:${port}`;

import path from 'path';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Video Microservice API',
            version: '1.0.0',
            description: 'API documentation for the Video Microservice handling video uploads and status.',
        },
        servers: [
            {
                url: `/api/v1`,
                description: 'API V1 Base Url',
            },
        ],
        components: {
            schemas: {
                Video: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        originalName: { type: 'string' },
                        s3Key: { type: 'string' },
                        bucketInfo: { type: 'object' },
                        mimeType: { type: 'string' },
                        size: { type: 'number' },
                        status: { type: 'string', enum: ['pending', 'uploading', 'processing', 'completed', 'failed'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    }
                },
                UploadInitResponse: {
                    type: 'object',
                    properties: {
                        uploadId: { type: 'string' },
                        key: { type: 'string' }
                    }
                }
            }
        }
    },
    // Use absolute paths to ensure files are found regardless of where the app is started
    apis: [
        path.join(__dirname, '../../routes/*.ts'),
        path.join(__dirname, '../../routes/*.js')
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
