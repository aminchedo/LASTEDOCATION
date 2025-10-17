import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: string;
    role: 'admin' | 'user';
    username: string;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required',
            message: 'لطفاً توکن دسترسی را ارسال کنید'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'توکن منقضی شده است'
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid token',
            message: 'توکن نامعتبر است'
        });
    }
};

export const generateToken = (payload: Omit<TokenPayload, 'exp'>): string => {
    const tokenPayload: TokenPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(tokenPayload, JWT_SECRET);
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
};
