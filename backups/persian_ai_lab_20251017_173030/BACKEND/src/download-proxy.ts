import express from 'express';
import fetch, { Response } from 'node-fetch';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const app = express();

const ALLOWED_HOSTS = new Set([
  'huggingface.co',
  'objects.githubusercontent.com',
  'raw.githubusercontent.com',
  'github.com',
  'storage.googleapis.com',
  'download.tensorflow.org'
]);

function isAllowed(target: string) {
  try { return ALLOWED_HOSTS.has(new URL(target).hostname); } catch { return false; }
}

function passHeader(name: string) {
  return ['content-type', 'content-length', 'content-disposition', 'accept-ranges', 'etag', 'last-modified', 'cache-control']
    .includes(name.toLowerCase());
}

async function follow(url: string, init: RequestInit = {}, limit = 5): Promise<Response> {
  if (limit <= 0) throw new Error('Too many redirects');
  const res = await fetch(url, {
    ...init,
    redirect: 'manual',
    agent: (parsed: any) =>
      parsed.protocol === 'http:' ? new http.Agent({ keepAlive: true }) : new https.Agent({ keepAlive: true }) as any
  } as any);
  if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
    const next = new URL(res.headers.get('location')!, url).toString();
    return follow(next, init, limit - 1);
  }
  return res;
}

// GET /api/v1/sources/proxy?url=ENCODED
app.get('/api/v1/sources/proxy', async (req, res) => {
  const raw = String(req.query.url || '');
  if (!raw) return res.status(400).send('Missing url');
  if (!isAllowed(raw)) return res.status(400).send('Host not allowed');

  try {
    const upstream = await follow(raw);
    if (!upstream.ok || !upstream.body) return res.status(upstream.status).send('Upstream error');

    const cd = upstream.headers.get('content-disposition');
    let filename = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
    if (!filename) filename = decodeURIComponent(new URL(upstream.url).pathname.split('/').pop() || 'download.bin');

    res.setHeader('Access-Control-Allow-Origin', '*');
    for (const [k, v] of upstream.headers.entries()) if (passHeader(k) && v) res.setHeader(k, v);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    upstream.body.pipe(res);
    return;
  } catch (error) {
    return res.status(500).send('Proxy error');
  }
});

// GET /api/v1/sources/resolve?url=ENCODED
app.get('/api/v1/sources/resolve', async (req, res) => {
  try {
    const raw = String(req.query.url || '');
    if (!raw) return res.status(400).json({ error: 'Missing url' });
    if (!isAllowed(raw)) return res.status(400).json({ error: 'Host not allowed' });

    const r = await follow(raw, { method: 'HEAD' }).catch(() => follow(raw, { method: 'GET' }));
    const finalUrl = r.url;
    const length = r.headers.get('content-length');
    const cd = r.headers.get('content-disposition');
    let filename = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
    if (!filename) filename = decodeURIComponent(new URL(finalUrl).pathname.split('/').pop() || 'download.bin');

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: r.ok, finalUrl, filename, sizeBytes: length ? Number(length) : null });
  } catch {
    return res.status(500).json({ error: 'Resolve error' });
  }
});

export default app;
