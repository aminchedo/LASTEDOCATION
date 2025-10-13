import request from 'supertest';
import express from 'express';
import trainRouter from '../src/routes/train';
import { authenticateToken } from '../src/middleware/auth';
import { getTestToken, assertSuccessResponse, assertErrorResponse } from './helpers';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/training', authenticateToken, trainRouter);
app.use('/api/train', authenticateToken, trainRouter);

describe('Training API', () => {
    const adminToken = getTestToken('admin');
    const userToken = getTestToken('user');

    describe('GET /api/training/jobs', () => {
        it('should return training jobs list with valid token', async () => {
            const response = await request(app)
                .get('/api/training/jobs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return training jobs on /api/train/jobs (original path)', async () => {
            const response = await request(app)
                .get('/api/train/jobs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/training/jobs')
                .expect(401);

            assertErrorResponse(response.body);
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/training/jobs')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(403);

            assertErrorResponse(response.body);
        });

        it('should allow user role access', async () => {
            const response = await request(app)
                .get('/api/training/jobs')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            assertSuccessResponse(response.body);
        });
    });

    describe('GET /api/training/jobs/:id', () => {
        it('should return 404 for non-existent job', async () => {
            const response = await request(app)
                .get('/api/training/jobs/nonexistent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            assertErrorResponse(response.body);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/training/jobs/some-id')
                .expect(401);
        });
    });

    describe('POST /api/training/jobs', () => {
        it('should reject job creation with missing required fields', async () => {
            const response = await request(app)
                .post('/api/training/jobs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);

            assertErrorResponse(response.body);
        });

        it('should reject job creation without token', async () => {
            await request(app)
                .post('/api/training/jobs')
                .send({
                    name: 'Test Job',
                    config: {
                        baseModelPath: './models/test',
                        datasetPath: './datasets/test',
                        outputDir: './output/test',
                        epochs: 5,
                        learningRate: 0.001,
                        batchSize: 8,
                    },
                })
                .expect(401);
        });
    });

    describe('GET /api/training/jobs/:id/logs', () => {
        it('should return 404 for non-existent job logs', async () => {
            const response = await request(app)
                .get('/api/training/jobs/nonexistent-id/logs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            assertErrorResponse(response.body);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/training/jobs/some-id/logs')
                .expect(401);
        });
    });

    describe('DELETE /api/training/jobs/:id', () => {
        it('should return 404 when canceling non-existent job', async () => {
            const response = await request(app)
                .delete('/api/training/jobs/nonexistent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            assertErrorResponse(response.body);
        });

        it('should require authentication', async () => {
            await request(app)
                .delete('/api/training/jobs/some-id')
                .expect(401);
        });
    });
});

