export const config = {
    projectApiUrl: import.meta.env.VITE_PROJECT_API_URL as string || 'http://localhost:4000/api',
    videoApiUrl: import.meta.env.VITE_VIDEO_API_URL as string || 'http://localhost:5001/api/v1',
} as const;
