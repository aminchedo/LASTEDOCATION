/**
 * WebSocket Service for Real-time Updates
 */
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../middleware/logger';
import { downloadManager } from './download-manager.service';
import { trainingService } from './training.service';

let io: SocketIOServer | null = null;

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

/**
 * Initialize WebSocket server
 */
export function initWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info({
      msg: 'websocket_client_connected',
      socketId: socket.id,
      clientIp: socket.handshake.address
    });

    socket.on('disconnect', () => {
      logger.info({
        msg: 'websocket_client_disconnected',
        socketId: socket.id
      });
    });

    // Subscribe to download updates
    socket.on('subscribe:download', (downloadId: string) => {
      socket.join(`download:${downloadId}`);
      logger.debug({
        msg: 'subscribed_to_download',
        socketId: socket.id,
        downloadId
      });
    });

    // Unsubscribe from download updates
    socket.on('unsubscribe:download', (downloadId: string) => {
      socket.leave(`download:${downloadId}`);
      logger.debug({
        msg: 'unsubscribed_from_download',
        socketId: socket.id,
        downloadId
      });
    });

    // Subscribe to training updates
    socket.on('subscribe:training', (jobId: string) => {
      socket.join(`training:${jobId}`);
      logger.debug({
        msg: 'subscribed_to_training',
        socketId: socket.id,
        jobId
      });
    });

    // Unsubscribe from training updates
    socket.on('unsubscribe:training', (jobId: string) => {
      socket.leave(`training:${jobId}`);
      logger.debug({
        msg: 'unsubscribed_from_training',
        socketId: socket.id,
        jobId
      });
    });

    // Subscribe to user's downloads
    socket.on('subscribe:user:downloads', (userId: string) => {
      socket.join(`user:${userId}:downloads`);
      logger.debug({
        msg: 'subscribed_to_user_downloads',
        socketId: socket.id,
        userId
      });
    });

    // Subscribe to user's training jobs
    socket.on('subscribe:user:training', (userId: string) => {
      socket.join(`user:${userId}:training`);
      logger.debug({
        msg: 'subscribed_to_user_training',
        socketId: socket.id,
        userId
      });
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  });

  // Setup event listeners for download manager
  setupDownloadListeners();

  // Setup event listeners for training service
  setupTrainingListeners();

  logger.info({ msg: 'websocket_server_initialized' });

  return io;
}

/**
 * Setup download event listeners
 */
function setupDownloadListeners(): void {
  downloadManager.on('progress', (data) => {
    emitToRoom(`download:${data.downloadId}`, 'download:progress', data);
  });

  downloadManager.on('completed', (data) => {
    emitToRoom(`download:${data.downloadId}`, 'download:completed', data);
  });

  downloadManager.on('failed', (data) => {
    emitToRoom(`download:${data.downloadId}`, 'download:failed', data);
  });

  downloadManager.on('cancelled', (data) => {
    emitToRoom(`download:${data.downloadId}`, 'download:cancelled', data);
  });
}

/**
 * Setup training event listeners
 */
function setupTrainingListeners(): void {
  trainingService.on('progress', (data) => {
    emitToRoom(`training:${data.jobId}`, 'training:progress', data);
  });

  trainingService.on('completed', (data) => {
    emitToRoom(`training:${data.jobId}`, 'training:completed', data);
  });

  trainingService.on('failed', (data) => {
    emitToRoom(`training:${data.jobId}`, 'training:failed', data);
  });

  trainingService.on('cancelled', (data) => {
    emitToRoom(`training:${data.jobId}`, 'training:cancelled', data);
  });
}

/**
 * Emit message to all clients
 */
export function emitToAll(event: string, data: any): void {
  if (!io) {
    logger.warn({ msg: 'websocket_not_initialized' });
    return;
  }

  const message: WebSocketMessage = {
    type: event,
    data,
    timestamp: new Date().toISOString()
  };

  io.emit(event, message);

  logger.debug({
    msg: 'websocket_broadcast',
    event,
    dataKeys: Object.keys(data)
  });
}

/**
 * Emit message to specific room
 */
export function emitToRoom(room: string, event: string, data: any): void {
  if (!io) {
    logger.warn({ msg: 'websocket_not_initialized' });
    return;
  }

  const message: WebSocketMessage = {
    type: event,
    data,
    timestamp: new Date().toISOString()
  };

  io.to(room).emit(event, message);

  logger.debug({
    msg: 'websocket_room_emit',
    room,
    event,
    dataKeys: Object.keys(data)
  });
}

/**
 * Emit message to specific socket
 */
export function emitToSocket(socketId: string, event: string, data: any): void {
  if (!io) {
    logger.warn({ msg: 'websocket_not_initialized' });
    return;
  }

  const message: WebSocketMessage = {
    type: event,
    data,
    timestamp: new Date().toISOString()
  };

  io.to(socketId).emit(event, message);

  logger.debug({
    msg: 'websocket_socket_emit',
    socketId,
    event,
    dataKeys: Object.keys(data)
  });
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  return io ? io.engine.clientsCount : 0;
}

/**
 * Broadcast download update
 */
export function broadcastDownloadUpdate(downloadId: string, data: any): void {
  emitToRoom(`download:${downloadId}`, 'download:update', data);
}

/**
 * Broadcast training update
 */
export function broadcastTrainingUpdate(jobId: string, data: any): void {
  emitToRoom(`training:${jobId}`, 'training:update', data);
}

/**
 * Broadcast notification to user
 */
export function notifyUser(userId: string, notification: {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}): void {
  emitToRoom(`user:${userId}`, 'notification', notification);
}

export default {
  initWebSocket,
  emitToAll,
  emitToRoom,
  emitToSocket,
  getWebSocketServer,
  getConnectedClientsCount,
  broadcastDownloadUpdate,
  broadcastTrainingUpdate,
  notifyUser
};
