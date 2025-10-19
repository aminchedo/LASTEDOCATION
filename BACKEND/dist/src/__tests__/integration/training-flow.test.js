"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../routes/auth"));
const training_1 = __importDefault(require("../../routes/training"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Create test app
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/training', training_1.default);
describe('Training Flow Integration Tests', () => {
    let authToken;
    let userId;
    // Clean up before each test
    beforeEach(async () => {
        // Clear users data
        const usersFile = path_1.default.join(process.cwd(), 'data', 'users.json');
        try {
            await fs_1.default.promises.writeFile(usersFile, JSON.stringify([], null, 2));
        }
        catch (error) {
            // File might not exist, that's okay
        }
    });
    describe('Authentication', () => {
        it('should register a new user', async () => {
            const response = await (0, supertest_1.default)(app)
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });
            expect(response.status).toBe(400);
            expect(response.body.ok).toBe(false);
            expect(response.body.error).toContain('already exists');
        });
        it('should login with valid credentials', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.token).toBeDefined();
        });
        it('should reject login with invalid credentials', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
            expect(response.body.ok).toBe(false);
        });
        it('should get current user with valid token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.user.id).toBe(userId);
        });
        it('should reject request without token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/me');
            expect(response.status).toBe(401);
        });
    });
    describe('Training Jobs', () => {
        it('should reject creating job without auth', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/training')
                .send({
                epochs: 5,
                batch_size: 32,
                lr: 0.001
            });
            expect(response.status).toBe(401);
        });
        it('should create training job with auth', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/training')
                .set('Authorization', `Bearer ${authToken}`)
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
            const response = await (0, supertest_1.default)(app)
                .get('/api/training/jobs')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.jobs).toBeDefined();
            expect(Array.isArray(response.body.jobs)).toBe(true);
        });
    });
    describe('Validation', () => {
        it('should validate email format on registration', async () => {
            const response = await (0, supertest_1.default)(app)
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
            const response = await (0, supertest_1.default)(app)
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: 'newuser@example.com'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });
});
//# sourceMappingURL=training-flow.test.js.map