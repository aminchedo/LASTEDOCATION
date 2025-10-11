import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { getAuthHeaders } from '../utils/hf-token';

const router = Router();
const HF_API_BASE = 'https://huggingface.co/api';

interface RateLimitEntry {
  requests: number[];
}

const rateLimits = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip) || { requests: [] };
  
  entry.requests = entry.requests.filter(time => now - time < 60000);
  
  if (entry.requests.length >= 30) {
    return false;
  }
  
  entry.requests.push(now);
  rateLimits.set(ip, entry);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits.entries()) {
    entry.requests = entry.requests.filter(time => now - time < 60000);
    if (entry.requests.length === 0) {
      rateLimits.delete(ip);
    }
  }
}, 120000);

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ 
      error: 'rate_limit_exceeded',
      message: 'Maximum 30 requests per minute. Please try again later.'
    });
    return;
  }

  try {
    const { 
      kind = 'models', 
      q = '', 
      page = '1', 
      limit = '10', 
      sort = 'downloads' 
    } = req.query as Record<string, string>;

    const validKinds = ['models', 'datasets', 'tts'];
    if (!validKinds.includes(kind)) {
      res.status(400).json({ 
        error: 'invalid_kind',
        message: 'Kind must be one of: models, datasets, tts'
      });
      return;
    }

    const pageNum = Math.max(1, Math.min(100, parseInt(page, 10) || 1));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

    const endpoint = kind === 'datasets' ? 'datasets' : 'models';
    const url = new URL(`${HF_API_BASE}/${endpoint}`);
    
    if (q && q.trim()) {
      url.searchParams.set('search', q.trim());
    }
    
    if (kind === 'tts') {
      url.searchParams.set('filter', 'text-to-speech');
    }
    
    url.searchParams.set('sort', sort);
    url.searchParams.set('limit', String(limitNum));
    url.searchParams.set('full', 'true');
    url.searchParams.set('direction', '-1');

    const response = await fetch(url.toString(), {
      headers: {
        ...getAuthHeaders(),
        'User-Agent': 'HF-Proxy/1.0'
      },
      timeout: 15000
    } as any);

    if (!response.ok) {
      console.error(`[HF] API error: ${response.status} ${response.statusText}`);
      res.status(response.status).json({ 
        error: `upstream_error_${response.status}`,
        message: 'Hugging Face API request failed'
      });
      return;
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : [];

    const normalized = items.map((item: any) => ({
      id: item.id || '',
      author: item.author || 'unknown',
      downloads: item.downloads ?? item.downloadCount ?? 0,
      likes: item.likes ?? 0,
      lastModified: item.lastModified || item.updatedAt || new Date().toISOString(),
      tags: Array.isArray(item.tags) ? item.tags : [],
      private: Boolean(item.private),
      cardData: {
        libraryName: item.library_name || item.libraryName || null,
        task: item.pipeline_tag || item.task || null,
        description: item.description || '',
        sha: item.sha || 'main',
      }
    }));

    res.json({
      page: pageNum,
      limit: limitNum,
      total: normalized.length,
      items: normalized
    });

  } catch (error: any) {
    console.error('[HF/search] Error:', error.message);
    res.status(500).json({ 
      error: 'search_failed',
      message: error.message 
    });
  }
});

router.get('/download/:repoId/:revision', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ error: 'rate_limit_exceeded' });
    return;
  }

  try {
    const { repoId, revision } = req.params;
    const { path } = req.query as { path?: string };

    if (!repoId || !revision || !path) {
      res.status(400).json({ 
        error: 'missing_parameters',
        message: 'repoId, revision, and path are required'
      });
      return;
    }

    if (path.includes('..') || path.startsWith('/')) {
      res.status(400).json({ 
        error: 'invalid_path',
        message: 'Path traversal not allowed'
      });
      return;
    }

    const fileUrl = `https://huggingface.co/${encodeURIComponent(repoId)}/resolve/${encodeURIComponent(revision)}/${path}`;
    
    const response = await fetch(fileUrl, {
      headers: {
        ...getAuthHeaders(),
        'User-Agent': 'HF-Proxy/1.0'
      },
      timeout: 30000
    } as any);

    if (!response.ok) {
      res.status(response.status).json({ 
        error: `download_failed_${response.status}`,
        message: 'File not found or access denied'
      });
      return;
    }

    const filename = path.split('/').pop() || 'download';
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    if (response.body) {
      response.body.pipe(res as any);
    } else {
      throw new Error('No response body from upstream');
    }

  } catch (error: any) {
    console.error('[HF/download] Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'download_failed',
        message: error.message 
      });
    }
  }
});

export default router;
