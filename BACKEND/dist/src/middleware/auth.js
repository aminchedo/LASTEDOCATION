"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const authenticateToken = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
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
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'توکن نامعتبر است'
        });
    }
};
exports.authenticateToken = authenticateToken;
const generateToken = (payload) => {
    const tokenPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    return jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.js.map