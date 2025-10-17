// Test setup file
// This runs before all tests
import '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use different port for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Global test utilities
global.console = {
    ...console,
    // Suppress console.log during tests unless explicitly needed
    // log: jest.fn(),
    // Uncomment above to suppress logs, or keep logs for debugging
};

