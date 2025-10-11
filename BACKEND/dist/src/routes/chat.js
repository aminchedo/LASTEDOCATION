"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../utils/validate");
const apiConfig_1 = require("../services/apiConfig");
const logger_1 = require("../middleware/logger");
const persianLLMService_1 = require("../services/persianLLMService");
const monitoringService_1 = require("../services/monitoringService");
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
const monitoringService = new monitoringService_1.MonitoringService();
const chatSchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    history: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['system', 'user', 'assistant']),
        content: zod_1.z.string().min(1),
    })).optional(),
    model: zod_1.z.string().optional(),
    temperature: zod_1.z.number().min(0).max(2).default(0.7).optional(),
    maxTokens: zod_1.z.number().min(50).max(8000).optional(),
    stream: zod_1.z.boolean().optional(),
});
router.post('/', (0, validate_1.validate)(chatSchema), async (req, res) => {
    const { message, history = [], model: _model, temperature = 0.7, maxTokens = 1500, stream = false } = req.validated;
    const { source, baseUrl, apiKey } = (0, apiConfig_1.getActiveEndpoint)();
    // Convert frontend format to backend format
    const messages = [
        ...history,
        { role: 'user', content: message }
    ];
    const started = Date.now();
    try {
        // Use real Persian LLM service for local responses
        if (source === 'local') {
            const persianLLM = new persianLLMService_1.PersianLLMService();
            const response = await persianLLM.generateResponse(messages, {
                temperature,
                maxTokens,
                stream
            });
            const latency = Date.now() - started;
            logger_1.logger.info({
                msg: 'chat_request',
                api_source: source,
                temperature,
                maxTokens,
                latency_ms: latency,
            });
            // Record metrics
            monitoringService.recordRequest(latency, true);
            return res.json({
                message: response.text,
                model: response.model,
                tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
                latency_ms: latency,
            });
        }
        // External call (example Anthropic/OpenAI-like)
        const response = await (0, node_fetch_1.default)(`${baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey ? `Bearer ${apiKey}` : '',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: maxTokens,
                temperature,
                messages,
                stream,
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            logger_1.logger.error({ msg: 'external_api_error', status: response.status, text });
            return res.status(502).json({ error: true, code: 'UPSTREAM_ERROR', details: text });
        }
        const latency = Date.now() - started;
        if (!stream) {
            const data = await response.json();
            logger_1.logger.info({ msg: 'chat_request', api_source: source, latency_ms: latency });
            // Record metrics for external API
            monitoringService.recordRequest(latency, true);
            return res.json({ ...data, latency_ms: latency });
        }
        // If stream=true, upgrade to SSE (optional: implement later if needed)
        // For now, force non-stream. Keep interface compatible.
        const data = await response.json();
        logger_1.logger.info({ msg: 'chat_request_stream_faux', api_source: source, latency_ms: latency });
        // Record metrics for external API
        monitoringService.recordRequest(latency, true);
        return res.json({ ...data, latency_ms: latency });
    }
    catch (err) {
        const latency = Date.now() - started;
        logger_1.logger.error({ msg: 'chat_handler_error', err: err?.stack || err?.message });
        // Record error metrics
        monitoringService.recordRequest(latency, false);
        return res.status(500).json({ error: true, code: 'CHAT_HANDLER_ERROR', message: 'Internal error' });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map