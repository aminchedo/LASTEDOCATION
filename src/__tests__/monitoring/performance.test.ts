import { describe, it, expect, beforeEach } from '@jest/globals';
import { performanceMonitor } from '../../monitoring/performance';

describe('Performance Monitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('should track operation duration', async () => {
    const result = await performanceMonitor.trackOperation(
      'test-operation',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      }
    );

    expect(result).toBe('success');
    
    const stats = performanceMonitor.getStats('test-operation');
    expect(stats.count).toBe(1);
    expect(stats.avgDuration).toBeGreaterThanOrEqual(100);
  });

  it('should track multiple operations', async () => {
    await performanceMonitor.trackOperation('op1', async () => 'result1');
    await performanceMonitor.trackOperation('op2', async () => 'result2');
    await performanceMonitor.trackOperation('op1', async () => 'result3');

    const operations = performanceMonitor.getOperations();
    expect(operations).toContain('op1');
    expect(operations).toContain('op2');

    const op1Stats = performanceMonitor.getStats('op1');
    expect(op1Stats.count).toBe(2);
  });

  it('should handle errors and still track duration', async () => {
    await expect(
      performanceMonitor.trackOperation('error-op', async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    const stats = performanceMonitor.getStats('error-op');
    expect(stats.count).toBe(1);
  });
});
