import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRouter from '../src/routes/auth';
import trainRouter from '../src/routes/train';
import monitoringRouter from '../src/routes/monitoring';
import experimentsRouter from '../src/routes/experiments';
import sourcesRouter from '../src/routes/sources';
import { authenticateToken } from '../src/middleware/auth';
import { mockUsers, assertSuccessResponse } from './helpers';

// Create full test app mimicking real server
const app = express();
app.use(cors());
app.use(express.json());

// Mount all routes
app.use('/api/auth', authRouter);
app.use('/api/train', authenticateToken, trainRouter);
app.use('/api/training', authenticateToken, trainRouter);
app.use('/api/monitoring', authenticateToken, monitoringRouter);
app.use('/api/experiments', authenticateToken, experimentsRouter);
app.use('/api/sources', authenticateToken, sourcesRouter);

describe('Integration Tests - Complete Workflows', () => {
    let authToken: string;
    let userId: string;

    describe('User Authentication Flow', () => {
        it('should complete full authentication workflow', async () => {
            // Step 1: Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                })
                .expect(200);

            assertSuccessResponse(loginResponse.body);
            expect(loginResponse.body).toHaveProperty('token');
            expect(loginResponse.body).toHaveProperty('user');

            authToken = loginResponse.body.token;
            userId = loginResponse.body.user.id;

            // Step 2: Verify token
            const verifyResponse = await request(app)
                .post('/api/auth/verify')
                .send({ token: authToken })
                .expect(200);

            assertSuccessResponse(verifyResponse.body);
            expect(verifyResponse.body.user.id).toBe(userId);

            // Step 3: Use token to access protected resource
            const protectedResponse = await request(app)
                .get('/api/training/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(protectedResponse.body);

            // Step 4: Logout
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            assertSuccessResponse(logoutResponse.body);
        });
    });

    describe('Cross-Route Data Flow', () => {
        beforeAll(async () => {
            // Get auth token for subsequent tests
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                });
            authToken = loginResponse.body.token;
        });

        it('should access multiple protected endpoints with same token', async () => {
            // Access training endpoint
            const trainingResponse = await request(app)
                .get('/api/training/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(trainingResponse.body);

            // Access monitoring endpoint
            const monitoringResponse = await request(app)
                .get('/api/monitoring/metrics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(monitoringResponse.body);

            // Access experiments endpoint
            const experimentsResponse = await request(app)
                .get('/api/experiments')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(experimentsResponse.body);

            // Access sources endpoint
            const sourcesResponse = await request(app)
                .get('/api/sources/installed')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(sourcesResponse.body);
        });

        it('should handle concurrent requests correctly', async () => {
            const requests = [
                request(app)
                    .get('/api/training/jobs')
                    .set('Authorization', `Bearer ${authToken}`),
                request(app)
                    .get('/api/monitoring/timeseries')
                    .set('Authorization', `Bearer ${authToken}`),
                request(app)
                    .get('/api/monitoring/models')
                    .set('Authorization', `Bearer ${authToken}`),
                request(app)
                    .get('/api/experiments')
                    .set('Authorization', `Bearer ${authToken}`),
            ];

            const responses = await Promise.all(requests);

            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                assertSuccessResponse(response.body);
            });
        });
    });

    describe('Path Alias Verification', () => {
        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                });
            authToken = loginResponse.body.token;
        });

        it('should access same resource via both /api/train and /api/training', async () => {
            // Access via /api/train
            const trainResponse = await request(app)
                .get('/api/train/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(trainResponse.body);

            // Access via /api/training (alias)
            const trainingResponse = await request(app)
                .get('/api/training/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            assertSuccessResponse(trainingResponse.body);

            // Both should return the same data
            expect(trainingResponse.body.data).toEqual(trainResponse.body.data);
            expect(trainingResponse.body.total).toBe(trainResponse.body.total);
        });
    });

    describe('Error Handling Flow', () => {
        it('should handle missing authentication consistently across endpoints', async () => {
            const endpoints = [
                '/api/training/jobs',
                '/api/monitoring/timeseries',
                '/api/experiments',
                '/api/sources/installed',
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .expect(401);

                expect(response.body).toHaveProperty('success');
                expect(response.body.success).toBe(false);
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should handle invalid token consistently across endpoints', async () => {
            const invalidToken = 'Bearer invalid.token.here';
            const endpoints = [
                '/api/training/jobs',
                '/api/monitoring/metrics',
                '/api/experiments',
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', invalidToken)
                    .expect(403);

                expect(response.body).toHaveProperty('success');
                expect(response.body.success).toBe(false);
            }
        });
    });

    describe('Response Format Consistency', () => {
        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                });
            authToken = loginResponse.body.token;
        });

        it('should have consistent success response format across all endpoints', async () => {
            const endpoints = [
                '/api/training/jobs',
                '/api/monitoring/timeseries',
                '/api/monitoring/models',
                '/api/monitoring/percentiles',
                '/api/experiments',
                '/api/sources/installed',
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                // All success responses should have this structure
                expect(response.body).toHaveProperty('success');
                expect(response.body.success).toBe(true);
                expect(response.body).toHaveProperty('data');
            }
        });
    });

    describe('CORS and Headers', () => {
        it('should include CORS headers', async () => {
            const response = await request(app)
                .options('/api/auth/login')
                .expect(204);

            // CORS middleware should add these headers
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });

        it('should accept JSON content type', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                })
                .expect(200);

            assertSuccessResponse(response.body);
        });
    });
});

