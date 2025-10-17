import request from 'supertest';
import express from 'express';
import monitoringRouter from '../src/routes/monitoring';
import { authenticateToken } from '../src/middleware/auth';
import { getTestToken, assertSuccessResponse, assertErrorResponse } from './helpers';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/monitoring', authenticateToken, monitoringRouter);

describe('Monitoring API', () => {
    const adminToken = getTestToken('admin');
    const userToken = getTestToken('user');

    describe('GET /api/monitoring/timeseries', () => {
        it('should return time-series data with valid token', async () => {
            const response = await request(app)
                .get('/api/monitoring/timeseries')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Verify data structure - actual API returns array of objects with timestamp, requests, responseTime, errors
            if (response.body.data.length > 0) {
                const dataPoint = response.body.data[0];
                expect(dataPoint).toHaveProperty('timestamp');
                expect(dataPoint).toHaveProperty('requests');
                expect(dataPoint).toHaveProperty('responseTime');
                expect(dataPoint).toHaveProperty('errors');
            }
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/monitoring/timeseries')
                .expect(401);

            assertErrorResponse(response.body);
        });

        it('should allow user role access', async () => {
            const response = await request(app)
                .get('/api/monitoring/timeseries')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
        });
    });

    describe('GET /api/monitoring/models', () => {
        it('should return model breakdown with valid token', async () => {
            const response = await request(app)
                .get('/api/monitoring/models')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);

            // If there are models, check structure - actual API returns {name, requests, avgResponseTime}
            if (response.body.data.length > 0) {
                const model = response.body.data[0];
                expect(model).toHaveProperty('name');
                expect(model).toHaveProperty('requests');
                expect(model).toHaveProperty('avgResponseTime');
            }
        });

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/monitoring/models')
                .expect(401);
        });
    });

    describe('GET /api/monitoring/percentiles', () => {
        it('should return response time percentiles with valid token', async () => {
            const response = await request(app)
                .get('/api/monitoring/percentiles')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('data');

            // Actual API returns object with p50, p75, p90, p95, p99 properties
            expect(response.body.data).toHaveProperty('p50');
            expect(response.body.data).toHaveProperty('p75');
            expect(response.body.data).toHaveProperty('p90');
            expect(response.body.data).toHaveProperty('p95');
            expect(response.body.data).toHaveProperty('p99');

            // All percentile values should be numbers
            expect(typeof response.body.data.p50).toBe('number');
            expect(typeof response.body.data.p75).toBe('number');
            expect(typeof response.body.data.p90).toBe('number');
            expect(typeof response.body.data.p95).toBe('number');
            expect(typeof response.body.data.p99).toBe('number');
        });

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/monitoring/percentiles')
                .expect(401);
        });
    });

    describe('GET /api/monitoring/metrics', () => {
        it('should return overall metrics with valid token', async () => {
            const response = await request(app)
                .get('/api/monitoring/metrics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('data');

            // Actual API returns detailed system metrics with nested structure
            const metrics = response.body.data;
            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('system');
            expect(metrics).toHaveProperty('cpu');
            expect(metrics).toHaveProperty('memory');

            // Verify nested structures exist
            expect(metrics.system).toHaveProperty('platform');
            expect(metrics.cpu).toHaveProperty('usage');
            expect(metrics.memory).toHaveProperty('total');
        }, 15000); // Increase timeout to 15 seconds for this slow endpoint

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/monitoring/metrics')
                .expect(401);
        });
    });

    describe('GET /api/monitoring/stats', () => {
        it('should return monitoring stats with valid token', async () => {
            const response = await request(app)
                .get('/api/monitoring/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('data');

            // Actual API returns stats with totalRequests, avgResponseTime, etc.
            const stats = response.body.data;
            expect(stats).toHaveProperty('totalRequests');
            expect(stats).toHaveProperty('avgResponseTime');
            expect(typeof stats.totalRequests).toBe('number');
            expect(typeof stats.avgResponseTime).toBe('number');
        });

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/monitoring/stats')
                .expect(401);
        });
    });
});

