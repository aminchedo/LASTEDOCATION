/**
 * Main server file with PostgreSQL and WebSocket support
 */
import { Express } from 'express';
declare const app: Express;
declare const httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export { app, httpServer };
//# sourceMappingURL=server-updated.d.ts.map