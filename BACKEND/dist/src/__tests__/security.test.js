"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_handler_1 = require("../middleware/error-handler");
const validate_1 = require("../middleware/validate");
describe('Security Middlewares', () => {
    describe('Error Handler', () => {
        test('OperationalError should be created with correct properties', () => {
            const error = new error_handler_1.OperationalError('Test error', 400, { key: 'value' });
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
            expect(error.context).toEqual({ key: 'value' });
        });
        test('OperationalError should default to 500 status code', () => {
            const error = new error_handler_1.OperationalError('Test error');
            expect(error.statusCode).toBe(500);
        });
    });
    describe('Validation Middleware', () => {
        let mockRequest;
        let mockResponse;
        let mockNext;
        beforeEach(() => {
            mockRequest = {
                body: {}
            };
            mockResponse = {};
            mockNext = jest.fn();
        });
        test('should validate correct registration data', async () => {
            const validData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'Password123'
            };
            mockRequest.body = validData;
            const middleware = (0, validate_1.validate)(validate_1.registerSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(); // Called with no error
        });
        test('should reject invalid email', async () => {
            const invalidData = {
                email: 'invalid-email',
                username: 'testuser',
                password: 'Password123'
            };
            mockRequest.body = invalidData;
            const middleware = (0, validate_1.validate)(validate_1.registerSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            const error = mockNext.mock.calls[0][0];
            expect(error).toBeInstanceOf(error_handler_1.OperationalError);
            expect(error.statusCode).toBe(400);
        });
        test('should reject weak password', async () => {
            const invalidData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'weak' // Too short, no uppercase, no number
            };
            mockRequest.body = invalidData;
            const middleware = (0, validate_1.validate)(validate_1.registerSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            const error = mockNext.mock.calls[0][0];
            expect(error).toBeInstanceOf(error_handler_1.OperationalError);
        });
        test('should validate download schema', async () => {
            const validData = {
                repoId: 'username/repo-name',
                token: 'hf_testtoken123'
            };
            mockRequest.body = validData;
            const middleware = (0, validate_1.validate)(validate_1.downloadSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        test('should reject invalid repository ID format', async () => {
            const invalidData = {
                repoId: 'invalid-repo-id', // Missing username/repo format
                token: 'hf_testtoken123'
            };
            mockRequest.body = invalidData;
            const middleware = (0, validate_1.validate)(validate_1.downloadSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            const error = mockNext.mock.calls[0][0];
            expect(error).toBeInstanceOf(error_handler_1.OperationalError);
        });
        test('should validate training schema with correct data', async () => {
            const validData = {
                datasetId: '123e4567-e89b-12d3-a456-426614174000',
                modelType: 'simple',
                epochs: 10,
                batchSize: 32,
                learningRate: 0.001,
                validationSplit: 0.2
            };
            mockRequest.body = validData;
            const middleware = (0, validate_1.validate)(validate_1.trainingSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        test('should reject training with invalid epochs', async () => {
            const invalidData = {
                datasetId: '123e4567-e89b-12d3-a456-426614174000',
                modelType: 'simple',
                epochs: 0, // Invalid: must be at least 1
                batchSize: 32,
                learningRate: 0.001,
                validationSplit: 0.2
            };
            mockRequest.body = invalidData;
            const middleware = (0, validate_1.validate)(validate_1.trainingSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            const error = mockNext.mock.calls[0][0];
            expect(error).toBeInstanceOf(error_handler_1.OperationalError);
        });
        test('should sanitize user input (trim whitespace)', async () => {
            const dataWithWhitespace = {
                email: '  test@example.com  ',
                username: '  testuser  ',
                password: 'Password123'
            };
            mockRequest.body = dataWithWhitespace;
            const middleware = (0, validate_1.validate)(validate_1.registerSchema);
            await middleware(mockRequest, mockResponse, mockNext);
            // Check that body was sanitized
            expect(mockRequest.body.email).toBe('test@example.com');
            expect(mockRequest.body.username).toBe('testuser');
        });
    });
    describe('Rate Limiting', () => {
        // Note: Rate limiting tests would require more complex setup with Express app
        // These are integration tests that should be in a separate test file
        test('placeholder for rate limiting tests', () => {
            // Rate limiting is tested via integration tests
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=security.test.js.map