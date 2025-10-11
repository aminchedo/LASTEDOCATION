import express from 'express';
import { generateToken, verifyToken } from '../middleware/auth';

const router = express.Router();

// Mock users for demo purposes
const MOCK_USERS = [
    {
        id: '1',
        username: 'admin',
        password: 'admin123',
        role: 'admin' as const,
        name: 'مدیر سیستم'
    },
    {
        id: '2',
        username: 'user',
        password: 'user123',
        role: 'user' as const,
        name: 'کاربر عادی'
    }
];

/**
 * POST /api/auth/login
 * Login with username/password and get token
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password required',
                message: 'نام کاربری و رمز عبور الزامی است'
            });
        }

        // Find user
        const user = MOCK_USERS.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            role: user.role,
            username: user.username
        });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: 'Login failed',
            details: error.message
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify token and get user info
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
        const user = MOCK_USERS.find(u => u.id === payload.userId);

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
                username: user.username,
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
        success: true,
        message: 'Logged out successfully',
        message_fa: 'خروج موفقیت‌آمیز'
    });
});

export default router;
