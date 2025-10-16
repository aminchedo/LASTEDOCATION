"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.getIO = getIO;
exports.emitJobUpdate = emitJobUpdate;
exports.emitJobStatusToUser = emitJobStatusToUser;
exports.emitToAll = emitToAll;
exports.getConnectedClientsCount = getConnectedClientsCount;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-please-use-a-long-random-string';
let io = null;
/**
 * Setup WebSocket server
 */
function setupWebSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
            credentials: true
        }
    });
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error('[WebSocket] Connection rejected: No token provided', {
                socketId: socket.id,
                ip: socket.handshake.address
            });
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Validate required user fields
            if (!user.userId || !user.username) {
                console.error('[WebSocket] Invalid token payload', {
                    socketId: socket.id,
                    hasUserId: !!user.userId,
                    hasUsername: !!user.username
                });
                return next(new Error('Authentication error: Invalid token payload'));
            }
            socket.user = {
                userId: user.userId,
                role: user.role || 'user',
                username: user.username
            };
            console.log('[WebSocket] Authentication successful', {
                socketId: socket.id,
                userId: user.userId,
                username: user.username
            });
            next();
        }
        catch (err) {
            console.error('[WebSocket] Token verification failed', {
                socketId: socket.id,
                error: err instanceof Error ? err.message : 'Unknown error'
            });
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const authSocket = socket;
        const user = authSocket.user;
        console.log('[WebSocket] Client connected', {
            socketId: socket.id,
            userId: user?.userId,
            username: user?.username,
            ip: socket.handshake.address
        });
        // Subscribe to job updates
        socket.on('subscribe_job', (jobId) => {
            socket.join(`job:${jobId}`);
            console.log(`[WebSocket] User ${user?.username} subscribed to job ${jobId}`);
        });
        // Unsubscribe from job updates
        socket.on('unsubscribe_job', (jobId) => {
            socket.leave(`job:${jobId}`);
            console.log(`[WebSocket] User ${user?.username} unsubscribed from job ${jobId}`);
        });
        // Subscribe to all user's jobs
        socket.on('subscribe_user_jobs', () => {
            if (user) {
                socket.join(`user:${user.userId}`);
                console.log(`[WebSocket] User ${user.username} subscribed to their jobs`);
            }
        });
        // Unsubscribe from all user's jobs
        socket.on('unsubscribe_user_jobs', () => {
            if (user) {
                socket.leave(`user:${user.userId}`);
                console.log(`[WebSocket] User ${user.username} unsubscribed from their jobs`);
            }
        });
        socket.on('disconnect', () => {
            console.log(`[WebSocket] User disconnected: ${user?.username}`);
        });
        socket.on('error', (error) => {
            console.error(`[WebSocket] Socket error for ${user?.username}:`, error);
        });
    });
    console.log('[WebSocket] Server initialized');
    return io;
}
/**
 * Get the Socket.IO server instance
 */
function getIO() {
    return io;
}
/**
 * Emit job update to all subscribers of a specific job
 */
function emitJobUpdate(jobId, status) {
    if (io) {
        io.to(`job:${jobId}`).emit('job_update', status);
        console.log(`[WebSocket] Emitted update for job ${jobId}:`, status.status);
    }
}
/**
 * Emit job status update to a specific user
 */
function emitJobStatusToUser(userId, status) {
    if (io) {
        io.to(`user:${userId}`).emit('job_status', status);
        console.log(`[WebSocket] Emitted job status to user ${userId}`);
    }
}
/**
 * Emit to all connected clients (broadcast)
 */
function emitToAll(event, data) {
    if (io) {
        io.emit(event, data);
        console.log(`[WebSocket] Broadcast ${event} to all clients`);
    }
}
/**
 * Get number of connected clients
 */
function getConnectedClientsCount() {
    if (io) {
        return io.sockets.sockets.size;
    }
    return 0;
}
//# sourceMappingURL=websocket.service.js.map