"use strict";
/**
 * Server-Sent Events for live training status updates
 * Provides real-time streaming of training metrics and status
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingSSE = void 0;
const logger_1 = require("../middleware/logger");
class TrainingSSE {
    constructor(state, metrics, trainer) {
        this.clients = new Map();
        this.state = state;
        this.metrics = metrics;
        this.trainer = trainer;
        this.startHeartbeat();
    }
    addClient(clientId, response, lastEventId) {
        // Set SSE headers
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        const client = {
            id: clientId,
            response,
            lastEventId
        };
        this.clients.set(clientId, client);
        // Send initial status
        this.sendStatusUpdate(clientId);
        // Send initial metrics
        this.sendMetricsUpdate(clientId);
        logger_1.logger.info('SSE client connected', { clientId, totalClients: this.clients.size });
        // Handle client disconnect
        response.on('close', () => {
            this.removeClient(clientId);
        });
        response.on('error', (error) => {
            logger_1.logger.warn('SSE client error', { clientId, error: error.message });
            this.removeClient(clientId);
        });
    }
    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            try {
                client.response.end();
            }
            catch (error) {
                // Ignore errors when ending response
            }
            this.clients.delete(clientId);
            logger_1.logger.info('SSE client disconnected', { clientId, totalClients: this.clients.size });
        }
    }
    async sendStatusUpdate(clientId) {
        try {
            const currentRun = this.state.getCurrentRun();
            const trainerStatus = this.trainer.getStatus();
            const status = {
                type: 'status',
                data: {
                    currentRun: currentRun ? {
                        id: currentRun.id,
                        status: currentRun.status,
                        currentEpoch: currentRun.currentEpoch,
                        currentStep: currentRun.currentStep,
                        totalEpochs: currentRun.totalEpochs,
                        totalSteps: currentRun.totalSteps,
                        bestMetric: currentRun.bestMetric,
                        startedAt: currentRun.startedAt,
                        finishedAt: currentRun.finishedAt
                    } : null,
                    trainer: trainerStatus,
                    timestamp: new Date().toISOString()
                }
            };
            if (clientId) {
                this.sendToClient(clientId, status);
            }
            else {
                this.broadcast(status);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send status update', { error: error.message });
        }
    }
    async sendMetricsUpdate(clientId) {
        try {
            const currentRun = this.state.getCurrentRun();
            if (!currentRun) {
                return;
            }
            const latestMetrics = await this.metrics.getLatestMetrics(currentRun.id);
            if (!latestMetrics) {
                return;
            }
            const metrics = {
                type: 'metric',
                data: {
                    runId: currentRun.id,
                    epoch: latestMetrics.epoch,
                    step: latestMetrics.step,
                    loss: latestMetrics.loss,
                    valLoss: latestMetrics.valLoss,
                    accuracy: latestMetrics.accuracy,
                    valAccuracy: latestMetrics.valAccuracy,
                    throughput: latestMetrics.throughput,
                    stepTimeMs: latestMetrics.stepTimeMs,
                    lr: latestMetrics.lr,
                    timestamp: latestMetrics.timestamp
                }
            };
            if (clientId) {
                this.sendToClient(clientId, metrics);
            }
            else {
                this.broadcast(metrics);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send metrics update', { error: error.message });
        }
    }
    async sendCheckpointUpdate(checkpointId, tag, metric) {
        try {
            const checkpoint = {
                type: 'checkpoint',
                data: {
                    checkpointId,
                    tag,
                    metric,
                    timestamp: new Date().toISOString()
                }
            };
            this.broadcast(checkpoint);
        }
        catch (error) {
            logger_1.logger.error('Failed to send checkpoint update', { error: error.message });
        }
    }
    sendError(error) {
        const errorEvent = {
            type: 'error',
            data: {
                message: error,
                timestamp: new Date().toISOString()
            }
        };
        this.broadcast(errorEvent);
    }
    sendToClient(clientId, event) {
        const client = this.clients.get(clientId);
        if (!client) {
            return;
        }
        try {
            const eventData = `data: ${JSON.stringify(event)}\n\n`;
            client.response.write(eventData);
        }
        catch (error) {
            logger_1.logger.warn('Failed to send SSE event to client', { clientId, error: error.message });
            this.removeClient(clientId);
        }
    }
    broadcast(event) {
        const eventData = `data: ${JSON.stringify(event)}\n\n`;
        for (const [clientId, client] of this.clients) {
            try {
                client.response.write(eventData);
            }
            catch (error) {
                logger_1.logger.warn('Failed to broadcast SSE event', { clientId, error: error.message });
                this.removeClient(clientId);
            }
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const heartbeat = {
                type: 'heartbeat',
                data: {
                    timestamp: new Date().toISOString()
                }
            };
            this.broadcast(heartbeat);
        }, 30000); // Send heartbeat every 30 seconds
    }
    stop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        // Close all client connections
        for (const [clientId, client] of this.clients) {
            try {
                client.response.end();
            }
            catch (error) {
                // Ignore errors
            }
        }
        this.clients.clear();
        logger_1.logger.info('SSE service stopped');
    }
    getClientCount() {
        return this.clients.size;
    }
}
exports.TrainingSSE = TrainingSSE;
//# sourceMappingURL=sse.js.map