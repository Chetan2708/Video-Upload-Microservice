import { createApiClient } from './apiClient';
import { config } from '../config';

export interface SystemConfig {
    features: {
        transcodingEnabled: boolean;
    };
}

const client = createApiClient(config.videoApiUrl);

export const getSystemConfig = async (): Promise<SystemConfig> => {
    const response = await client.get<SystemConfig>('/config');
    return response.data;
};
