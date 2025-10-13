/**
 * WebSocket Service for Real-time Updates
 */
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: string;
}
/**
 * Initialize WebSocket server
 */
export declare function initWebSocket(httpServer: HTTPServer): SocketIOServer;
/**
 * Emit message to all clients
 */
export declare function emitToAll(event: string, data: any): void;
/**
 * Emit message to specific room
 */
export declare function emitToRoom(room: string, event: string, data: any): void;
/**
 * Emit message to specific socket
 */
export declare function emitToSocket(socketId: string, event: string, data: any): void;
/**
 * Get WebSocket server instance
 */
export declare function getWebSocketServer(): SocketIOServer | null;
/**
 * Get number of connected clients
 */
export declare function getConnectedClientsCount(): number;
/**
 * Broadcast download update
 */
export declare function broadcastDownloadUpdate(downloadId: string, data: any): void;
/**
 * Broadcast training update
 */
export declare function broadcastTrainingUpdate(jobId: string, data: any): void;
/**
 * Broadcast notification to user
 */
export declare function notifyUser(userId: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
}): void;
declare const _default: {
    initWebSocket: typeof initWebSocket;
    emitToAll: typeof emitToAll;
    emitToRoom: typeof emitToRoom;
    emitToSocket: typeof emitToSocket;
    getWebSocketServer: typeof getWebSocketServer;
    getConnectedClientsCount: typeof getConnectedClientsCount;
    broadcastDownloadUpdate: typeof broadcastDownloadUpdate;
    broadcastTrainingUpdate: typeof broadcastTrainingUpdate;
    notifyUser: typeof notifyUser;
};
export default _default;
//# sourceMappingURL=websocket-real.service.d.ts.map