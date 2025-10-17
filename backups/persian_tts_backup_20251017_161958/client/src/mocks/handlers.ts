import { http, HttpResponse } from 'msw';

export const handlers = [
    http.get('/api/auth/verify', () =>
        HttpResponse.json({ authenticated: true })
    ),
    http.get('/api/train/status', () =>
        HttpResponse.json({ status: 'idle', progress: 0 })
    ),
    http.get('/api/monitoring/metrics', () =>
        HttpResponse.json({ totalRequests: 0, avgResponseTime: 0 })
    ),
    http.get('/api/experiments', () =>
        HttpResponse.json({ experiments: [] })
    ),
    http.get('/api/models/available', () =>
        HttpResponse.json({ models: [] })
    ),
    http.get('/api/sources/installed', () =>
        HttpResponse.json({ sources: [] })
    ),
    http.get('/api/datasets', () =>
        HttpResponse.json({ datasets: [] })
    ),
    http.get('/api/training/jobs', () =>
        HttpResponse.json({ jobs: [] })
    ),
    http.get('/api/notifications', () =>
        HttpResponse.json({ notifications: [] })
    ),
    http.get('/api/settings', () =>
        HttpResponse.json({
            theme: 'light',
            language: 'en',
            apiEndpoint: 'http://localhost:3001'
        })
    ),
];
