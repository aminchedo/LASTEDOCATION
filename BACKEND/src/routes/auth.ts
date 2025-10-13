import express from 'express';
import { generateToken, verifyToken, authenticateToken } from '../middleware/auth';
import { userModel } from '../models/User';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                ok: false,
                error: 'Email, password, and name are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                ok: false,
                error: 'Invalid email format'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                ok: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Create user
        const user = await userModel.create(email, password, name);

        // Generate token
        const token = generateToken({
            userId: user.id,
            role: user.role,
            username: user.email
        });

        return res.json({
            ok: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error: any) {
        if (error.message === 'User already exists') {
            return res.status(400).json({
                ok: false,
                error: 'User already exists'
            });
        }
        
        return res.status(500).json({
            ok: false,
            error: 'Registration failed',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const loginEmail = email || username; // Support both for backward compatibility

        if (!loginEmail || !password) {
            return res.status(400).json({
                ok: false,
                success: false,
                error: 'Email and password required',
                message: 'ایمیل و رمز عبور الزامی است'
            });
        }

        // Find user
        const user = await userModel.findByEmail(loginEmail);

        if (!user) {
            return res.status(401).json({
                ok: false,
                success: false,
                error: 'Invalid credentials',
                message: 'ایمیل یا رمز عبور اشتباه است'
            });
        }

        // Verify password
        const validPassword = await userModel.verifyPassword(user, password);
        
        if (!validPassword) {
            return res.status(401).json({
                ok: false,
                success: false,
                error: 'Invalid credentials',
                message: 'ایمیل یا رمز عبور اشتباه است'
            });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            role: user.role,
            username: user.email
        });

        return res.json({
            ok: true,
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            ok: false,
            success: false,
            error: 'Login failed',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                ok: false,
                error: 'Unauthorized'
            });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                ok: false,
                error: 'User not found'
            });
        }

        return res.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            ok: false,
            error: 'Failed to get user info',
            details: error.message
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify token and get user info (backward compatibility)
 */
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required',
                message: 'توکن الزامی است'
            });
        }

        const payload = verifyToken(token);

        if (!payload) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'توکن نامعتبر است'
            });
        }

        // Find user
        const user = await userModel.findById(payload.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
                message: 'کاربر یافت نشد'
            });
        }

        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: 'Token verification failed',
            details: error.message
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', async (_req, res) => {
    return res.json({
        ok: true,
        success: true,
        message: 'Logged out successfully',
        message_fa: 'خروج موفقیت‌آمیز'
    });
});

export default router;
