import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health';

const app = express();
app.use(express.json());
app.use('/health', healthRouter);

describe('Health Check API', () => {
  it('GET /health should return status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status');
  });

  it('GET /health/detailed should include metrics', async () => {
    const response = await request(app).get('/health/detailed');
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('metrics');
    expect(response.body.data).toHaveProperty('checks');
    expect(response.body.data.checks).toHaveProperty('database');
    expect(response.body.data.checks).toHaveProperty('filesystem');
  });
});
