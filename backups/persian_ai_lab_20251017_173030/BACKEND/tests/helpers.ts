import { generateToken } from '../src/middleware/auth';

/**
 * Generate a valid test token for authenticated requests
 */
export function getTestToken(role: 'admin' | 'user' = 'admin'): string {
    return generateToken({
        userId: role === 'admin' ? '1' : '2',
        role,
        username: role === 'admin' ? 'admin' : 'user',
    });
}

/**
 * Mock user credentials for testing
 */
export const mockUsers = {
    admin: {
        username: 'admin',
        password: 'admin123',
        role: 'admin' as const,
    },
    user: {
        username: 'user',
        password: 'user123',
        role: 'user' as const,
    },
};

/**
 * Common test data
 */
export const testData = {
    trainingJob: {
        name: 'Test Training Job',
        config: {
            baseModelPath: './models/test-base',
            datasetPath: './datasets/test-dataset',
            outputDir: './output/test',
            epochs: 3,
            learningRate: 0.001,
            batchSize: 4,
            useGpu: false,
        },
    },
    optimizationJob: {
        name: 'Test Optimization',
        baseModelPath: './models/test-base',
        datasetPath: './datasets/test-dataset',
        outputDir: './output/test-opt',
        config: {
            learningRate: { min: 0.0001, max: 0.01 },
            batchSize: { values: [4, 8, 16] },
            epochs: { values: [3, 5, 10] },
        },
        strategy: 'random' as const,
        maxTrials: 5,
    },
};

/**
 * Delay helper for async operations
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Assert response has success structure
 */
export function assertSuccessResponse(body: any) {
    expect(body).toHaveProperty('success');
    expect(body.success).toBe(true);
}

/**
 * Assert response has error structure
 */
export function assertErrorResponse(body: any, expectedError?: string) {
    expect(body).toHaveProperty('success');
    expect(body.success).toBe(false);
    expect(body).toHaveProperty('error');
    if (expectedError) {
        expect(body.error).toContain(expectedError);
    }
}

