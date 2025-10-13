import { describe, it, expect, beforeEach } from '@jest/globals';
import { analyticsTracker } from '../../monitoring/analytics';
import { Request, Response } from 'express';

describe('Analytics Tracker', () => {
  beforeEach(() => {
    analyticsTracker.clear();
  });

  it('should track API calls', () => {
    const mockReq = {
      route: { path: '/api/test' },
      path: '/api/test',
      method: 'GET',
    } as unknown as Request;

    const mockRes = {
      statusCode: 200,
    } as Response;

    analyticsTracker.track(mockReq, mockRes, 150);

    const stats = analyticsTracker.getEndpointStats();
    expect(stats.total).toBe(1);
    expect(stats.successful).toBe(1);
    expect(stats.failed).toBe(0);
  });

  it('should calculate success rate', () => {
    const mockReq = {
      route: { path: '/api/test' },
      path: '/api/test',
      method: 'GET',
    } as unknown as Request;

    // Track successful calls
    analyticsTracker.track(mockReq, { statusCode: 200 } as Response, 100);
    analyticsTracker.track(mockReq, { statusCode: 200 } as Response, 100);
    
    // Track failed call
    analyticsTracker.track(mockReq, { statusCode: 500 } as Response, 100);

    const stats = analyticsTracker.getEndpointStats();
    expect(stats.total).toBe(3);
    expect(stats.successful).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.successRate).toBeCloseTo(66.67, 1);
  });

  it('should calculate average duration', () => {
    const mockReq = {
      route: { path: '/api/test' },
      path: '/api/test',
      method: 'GET',
    } as unknown as Request;

    const mockRes = { statusCode: 200 } as Response;

    analyticsTracker.track(mockReq, mockRes, 100);
    analyticsTracker.track(mockReq, mockRes, 200);
    analyticsTracker.track(mockReq, mockRes, 300);

    const stats = analyticsTracker.getEndpointStats();
    expect(stats.avgDuration).toBe(200);
  });
});
