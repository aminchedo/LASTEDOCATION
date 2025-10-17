import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
/**
 * Setup WebSocket server
 */
export declare function setupWebSocket(httpServer: HttpServer): Server;
/**
 * Get the Socket.IO server instance
 */
export declare function getIO(): Server | null;
/**
 * Emit job update to all subscribers of a specific job
 */
export declare function emitJobUpdate(jobId: string, status: any): void;
/**
 * Emit job status update to a specific user
 */
export declare function emitJobStatusToUser(userId: string, status: any): void;
/**
 * Emit to all connected clients (broadcast)
 */
export declare function emitToAll(event: string, data: any): void;
/**
 * Get number of connected clients
 */
export declare function getConnectedClientsCount(): number;
/**
 * Get Socket.IO instance
 */
export declare function getSocketIOInstance(): Server;
//# sourceMappingURL=websocket.service.d.ts.map