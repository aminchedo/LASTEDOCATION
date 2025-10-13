import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-please-use-a-long-random-string';

let io: Server | null = null;

interface SocketUser {
  userId: string;
  role: string;
  username: string;
}

interface AuthSocket extends Socket {
  user?: SocketUser;
}

/**
 * Setup WebSocket server
 */
export function setupWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const user = jwt.verify(token, JWT_SECRET) as any;
      (socket as AuthSocket).user = {
        userId: user.userId,
        role: user.role,
        username: user.username
      };
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthSocket;
    const user = authSocket.user;
    
    console.log(`[WebSocket] User connected: ${user?.username} (${socket.id})`);

    // Subscribe to job updates
    socket.on('subscribe_job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      console.log(`[WebSocket] User ${user?.username} subscribed to job ${jobId}`);
    });

    // Unsubscribe from job updates
    socket.on('unsubscribe_job', (jobId: string) => {
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
export function getIO(): Server | null {
  return io;
}

/**
 * Emit job update to all subscribers of a specific job
 */
export function emitJobUpdate(jobId: string, status: any): void {
  if (io) {
    io.to(`job:${jobId}`).emit('job_update', status);
    console.log(`[WebSocket] Emitted update for job ${jobId}:`, status.status);
  }
}

/**
 * Emit job status update to a specific user
 */
export function emitJobStatusToUser(userId: string, status: any): void {
  if (io) {
    io.to(`user:${userId}`).emit('job_status', status);
    console.log(`[WebSocket] Emitted job status to user ${userId}`);
  }
}

/**
 * Emit to all connected clients (broadcast)
 */
export function emitToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
    console.log(`[WebSocket] Broadcast ${event} to all clients`);
  }
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  if (io) {
    return io.sockets.sockets.size;
  }
  return 0;
}
