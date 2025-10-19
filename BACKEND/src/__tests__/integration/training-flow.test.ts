import request from 'supertest';
import express from 'express';
import authRouter from '../../routes/auth';
import trainingRouter from '../../routes/training';
import { userModel } from '../../models/User';
import fs from 'fs';
import path from 'path';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/training', trainingRouter);

describe('Training Flow Integration Tests', () => {
  let authToken: string;
  let userId: string;

  // Clean up before each test
  beforeEach(async () => {
    // Clear users data
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    try {
      await fs.promises.writeFile(usersFile, JSON.stringify([], null, 2));
    } catch (error) {
      // File might not exist, that's okay
    }
    
    // Reset auth token and user ID
    authToken = '';
    userId = '';
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should not register duplicate user', async () => {
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User'
        });

      // Try to register the same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should login with valid credentials', async () => {
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logintest@example.com',
          password: 'password123',
          name: 'Login Test User'
        });

      // Then try to login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
    });

    it('should get current user with valid token', async () => {
      // First register and get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'metest@example.com',
          password: 'password123',
          name: 'Me Test User'
        });

      expect(registerResponse.status).toBe(200);
      const token = registerResponse.body.token;
      const userId = registerResponse.body.user.id;

      // Then test /me endpoint
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user.id).toBe(userId);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Training Jobs', () => {
    it('should reject creating job without auth', async () => {
      const response = await request(app)
        .post('/api/training')
        .send({
          epochs: 5,
          batch_size: 32,
          lr: 0.001
        });

      expect(response.status).toBe(401);
    });

    it('should create training job with auth', async () => {
      // First register and get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'trainingtest@example.com',
          password: 'password123',
          name: 'Training Test User'
        });

      expect(registerResponse.status).toBe(200);
      const token = registerResponse.body.token;

      // Then create training job
      const response = await request(app)
        .post('/api/training')
        .set('Authorization', `Bearer ${token}`)
        .send({
          epochs: 5,
          batch_size: 32,
          lr: 0.001
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.job_id).toBeDefined();
      expect(response.body.status).toBe('QUEUED');
    });

    it('should list jobs with auth', async () => {
      // First register and get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'listtest@example.com',
          password: 'password123',
          name: 'List Test User'
        });

      expect(registerResponse.status).toBe(200);
      const token = registerResponse.body.token;

      // Then list jobs
      const response = await request(app)
        .get('/api/training/jobs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.jobs).toBeDefined();
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate email format on registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });

    it('should validate password length on registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: '123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('6 characters');
    });

    it('should require all fields on registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
