import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../utils/validate';
import { getActiveEndpoint } from '../services/apiConfig';
import { logger } from '../middleware/logger';
import { PersianLLMService } from '../services/persianLLMService';
import { MonitoringService } from '../services/monitoringService';
import fetch from 'node-fetch';

const router = Router();
const monitoringService = new MonitoringService();

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string().min(1),
    })
  ).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7).optional(),
  maxTokens: z.number().min(50).max(8000).optional(),
  stream: z.boolean().optional(),
});

router.post('/', validate(chatSchema), async (req: Request, res: Response) => {
  const { message, history = [], model: _model, temperature = 0.7, maxTokens = 1500, stream = false } = (req as any).validated;
  const { source, baseUrl, apiKey } = getActiveEndpoint();

  // Convert frontend format to backend format
  const messages = [
    ...history,
    { role: 'user', content: message }
  ];

  const started = Date.now();
  try {
    // Use real Persian LLM service for local responses
    if (source === 'local') {
      const persianLLM = new PersianLLMService();
      const response = await persianLLM.generateResponse(messages, {
        temperature,
        maxTokens,
        stream
      });
      
      const latency = Date.now() - started;

      logger.info({
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
    const response = await fetch(`${baseUrl}/v1/messages`, {
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
      logger.error({ msg: 'external_api_error', status: response.status, text });
      return res.status(502).json({ error: true, code: 'UPSTREAM_ERROR', details: text });
    }

    const latency = Date.now() - started;

    if (!stream) {
      const data = await response.json();
      logger.info({ msg: 'chat_request', api_source: source, latency_ms: latency });
      
      // Record metrics for external API
      monitoringService.recordRequest(latency, true);
      
      return res.json({ ...data, latency_ms: latency });
    }

    // If stream=true, upgrade to SSE (optional: implement later if needed)
    // For now, force non-stream. Keep interface compatible.
    const data = await response.json();
    logger.info({ msg: 'chat_request_stream_faux', api_source: source, latency_ms: latency });
    
    // Record metrics for external API
    monitoringService.recordRequest(latency, true);
    
    return res.json({ ...data, latency_ms: latency });

  } catch (err: any) {
    const latency = Date.now() - started;
    logger.error({ msg: 'chat_handler_error', err: err?.stack || err?.message });
    
    // Record error metrics
    monitoringService.recordRequest(latency, false);
    
    return res.status(500).json({ error: true, code: 'CHAT_HANDLER_ERROR', message: 'Internal error' });
  }
});

export default router;