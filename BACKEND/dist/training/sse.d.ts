/**
 * Server-Sent Events for live training status updates
 * Provides real-time streaming of training metrics and status
 */
import { Response } from 'express';
import { TrainingStateManager } from './state';
import { MetricsManager } from './metrics';
import { CPUTrainer } from './trainer';
export interface SSEClient {
    id: string;
    response: Response;
    lastEventId?: string;
}
export declare class TrainingSSE {
    private clients;
    private state;
    private metrics;
    private trainer;
    private heartbeatInterval?;
    constructor(state: TrainingStateManager, metrics: MetricsManager, trainer: CPUTrainer);
    addClient(clientId: string, response: Response, lastEventId?: string): void;
    removeClient(clientId: string): void;
    sendStatusUpdate(clientId?: string): Promise<void>;
    sendMetricsUpdate(clientId?: string): Promise<void>;
    sendCheckpointUpdate(checkpointId: string, tag: string, metric: number): Promise<void>;
    sendError(error: string): void;
    private sendToClient;
    private broadcast;
    private startHeartbeat;
    stop(): void;
    getClientCount(): number;
}
//# sourceMappingURL=sse.d.ts.map