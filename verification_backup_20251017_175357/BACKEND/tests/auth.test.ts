import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';
import { mockUsers, assertSuccessResponse, assertErrorResponse } from './helpers';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
        it('should login successfully with valid admin credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                })
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('admin');
            expect(response.body.user.role).toBe('admin');
        });

        it('should login successfully with valid user credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.user.username,
                    password: mockUsers.user.password,
                })
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.role).toBe('user');
        });

        it('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'invalid',
                    password: 'wrong',
                })
                .expect(401);

            assertErrorResponse(response.body, 'Invalid credentials');
        });

        it('should reject login with missing username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'password',
                })
                .expect(400);

            assertErrorResponse(response.body);
        });

        it('should reject login with missing password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                })
                .expect(400);

            assertErrorResponse(response.body);
        });

        it('should return a valid JWT token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                })
                .expect(200);

            const token = response.body.token;
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            // JWT tokens have 3 parts separated by dots
            expect(token.split('.')).toHaveLength(3);
        });
    });

    describe('POST /api/auth/verify', () => {
        let validToken: string;

        beforeAll(async () => {
            // Get a valid token first
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: mockUsers.admin.username,
                    password: mockUsers.admin.password,
                });
            validToken = loginResponse.body.token;
        });

        it('should verify a valid token', async () => {
            const response = await request(app)
                .post('/api/auth/verify')
                .send({ token: validToken })
                .expect(200);

            assertSuccessResponse(response.body);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('admin');
        });

        it('should reject an invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/verify')
                .send({ token: 'invalid.token.here' })
                .expect(401);

            assertErrorResponse(response.body, 'Invalid token');
        });

        it('should reject request with missing token', async () => {
            const response = await request(app)
                .post('/api/auth/verify')
                .send({})
                .expect(400);

            assertErrorResponse(response.body);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            assertSuccessResponse(response.body);
        });
    });
});

