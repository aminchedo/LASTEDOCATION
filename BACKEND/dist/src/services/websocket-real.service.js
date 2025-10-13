"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = initWebSocket;
exports.emitToAll = emitToAll;
exports.emitToRoom = emitToRoom;
exports.emitToSocket = emitToSocket;
exports.getWebSocketServer = getWebSocketServer;
exports.getConnectedClientsCount = getConnectedClientsCount;
exports.broadcastDownloadUpdate = broadcastDownloadUpdate;
exports.broadcastTrainingUpdate = broadcastTrainingUpdate;
exports.notifyUser = notifyUser;
const socket_io_1 = require("socket.io");
const logger_1 = require("../middleware/logger");
const download_manager_service_1 = require("./download-manager.service");
const training_service_1 = require("./training.service");
let io = null;
/**
 * Initialize WebSocket server
 */
function initWebSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.info({
            msg: 'websocket_client_connected',
            socketId: socket.id,
            clientIp: socket.handshake.address
        });
        socket.on('disconnect', () => {
            logger_1.logger.info({
                msg: 'websocket_client_disconnected',
                socketId: socket.id
            });
        });
        // Subscribe to download updates
        socket.on('subscribe:download', (downloadId) => {
            socket.join(`download:${downloadId}`);
            logger_1.logger.debug({
                msg: 'subscribed_to_download',
                socketId: socket.id,
                downloadId
            });
        });
        // Unsubscribe from download updates
        socket.on('unsubscribe:download', (downloadId) => {
            socket.leave(`download:${downloadId}`);
            logger_1.logger.debug({
                msg: 'unsubscribed_from_download',
                socketId: socket.id,
                downloadId
            });
        });
        // Subscribe to training updates
        socket.on('subscribe:training', (jobId) => {
            socket.join(`training:${jobId}`);
            logger_1.logger.debug({
                msg: 'subscribed_to_training',
                socketId: socket.id,
                jobId
            });
        });
        // Unsubscribe from training updates
        socket.on('unsubscribe:training', (jobId) => {
            socket.leave(`training:${jobId}`);
            logger_1.logger.debug({
                msg: 'unsubscribed_from_training',
                socketId: socket.id,
                jobId
            });
        });
        // Subscribe to user's downloads
        socket.on('subscribe:user:downloads', (userId) => {
            socket.join(`user:${userId}:downloads`);
            logger_1.logger.debug({
                msg: 'subscribed_to_user_downloads',
                socketId: socket.id,
                userId
            });
        });
        // Subscribe to user's training jobs
        socket.on('subscribe:user:training', (userId) => {
            socket.join(`user:${userId}:training`);
            logger_1.logger.debug({
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
    logger_1.logger.info({ msg: 'websocket_server_initialized' });
    return io;
}
/**
 * Setup download event listeners
 */
function setupDownloadListeners() {
    download_manager_service_1.downloadManager.on('progress', (data) => {
        emitToRoom(`download:${data.downloadId}`, 'download:progress', data);
    });
    download_manager_service_1.downloadManager.on('completed', (data) => {
        emitToRoom(`download:${data.downloadId}`, 'download:completed', data);
    });
    download_manager_service_1.downloadManager.on('failed', (data) => {
        emitToRoom(`download:${data.downloadId}`, 'download:failed', data);
    });
    download_manager_service_1.downloadManager.on('cancelled', (data) => {
        emitToRoom(`download:${data.downloadId}`, 'download:cancelled', data);
    });
}
/**
 * Setup training event listeners
 */
function setupTrainingListeners() {
    training_service_1.trainingService.on('progress', (data) => {
        emitToRoom(`training:${data.jobId}`, 'training:progress', data);
    });
    training_service_1.trainingService.on('completed', (data) => {
        emitToRoom(`training:${data.jobId}`, 'training:completed', data);
    });
    training_service_1.trainingService.on('failed', (data) => {
        emitToRoom(`training:${data.jobId}`, 'training:failed', data);
    });
    training_service_1.trainingService.on('cancelled', (data) => {
        emitToRoom(`training:${data.jobId}`, 'training:cancelled', data);
    });
}
/**
 * Emit message to all clients
 */
function emitToAll(event, data) {
    if (!io) {
        logger_1.logger.warn({ msg: 'websocket_not_initialized' });
        return;
    }
    const message = {
        type: event,
        data,
        timestamp: new Date().toISOString()
    };
    io.emit(event, message);
    logger_1.logger.debug({
        msg: 'websocket_broadcast',
        event,
        dataKeys: Object.keys(data)
    });
}
/**
 * Emit message to specific room
 */
function emitToRoom(room, event, data) {
    if (!io) {
        logger_1.logger.warn({ msg: 'websocket_not_initialized' });
        return;
    }
    const message = {
        type: event,
        data,
        timestamp: new Date().toISOString()
    };
    io.to(room).emit(event, message);
    logger_1.logger.debug({
        msg: 'websocket_room_emit',
        room,
        event,
        dataKeys: Object.keys(data)
    });
}
/**
 * Emit message to specific socket
 */
function emitToSocket(socketId, event, data) {
    if (!io) {
        logger_1.logger.warn({ msg: 'websocket_not_initialized' });
        return;
    }
    const message = {
        type: event,
        data,
        timestamp: new Date().toISOString()
    };
    io.to(socketId).emit(event, message);
    logger_1.logger.debug({
        msg: 'websocket_socket_emit',
        socketId,
        event,
        dataKeys: Object.keys(data)
    });
}
/**
 * Get WebSocket server instance
 */
function getWebSocketServer() {
    return io;
}
/**
 * Get number of connected clients
 */
function getConnectedClientsCount() {
    return io ? io.engine.clientsCount : 0;
}
/**
 * Broadcast download update
 */
function broadcastDownloadUpdate(downloadId, data) {
    emitToRoom(`download:${downloadId}`, 'download:update', data);
}
/**
 * Broadcast training update
 */
function broadcastTrainingUpdate(jobId, data) {
    emitToRoom(`training:${jobId}`, 'training:update', data);
}
/**
 * Broadcast notification to user
 */
function notifyUser(userId, notification) {
    emitToRoom(`user:${userId}`, 'notification', notification);
}
exports.default = {
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
//# sourceMappingURL=websocket-real.service.js.map