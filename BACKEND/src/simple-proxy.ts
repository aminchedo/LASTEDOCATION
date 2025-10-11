import express from 'express';
import fetch from 'node-fetch';
import { URL } from 'url';

const app = express();

// ✅ EXPANDED: Added HuggingFace CDN domains for direct downloads
const ALLOWED_HOSTS = new Set([
  'huggingface.co',
  'cdn.huggingface.co',
  'cdn-lfs.huggingface.co',
  'cdn-lfs-us-1.huggingface.co',
  'cdn-lfs-eu-1.huggingface.co',
  'objects.githubusercontent.com',
  'raw.githubusercontent.com',
  'github.com',
  'storage.googleapis.com',
  'download.tensorflow.org'
]);

function isAllowed(target: string) {
  try { 
    return ALLOWED_HOSTS.has(new URL(target).hostname); 
  } catch { 
    return false; 
  }
}

function passHeader(name: string) {
  return ['content-type','content-length','content-disposition','accept-ranges','etag','last-modified','cache-control']
    .includes(name.toLowerCase());
}

// GET /api/v1/sources/proxy?url=ENCODED
app.get('/api/v1/sources/proxy', async (req, res) => {
  const raw = String(req.query.url || '');
  if (!raw) {
    res.status(400).send('Missing url');
    return;
  }
  if (!isAllowed(raw)) {
    res.status(400).send('Host not allowed');
    return;
  }

  try {
    const upstream = await fetch(raw);
    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status).send('Upstream error');
      return;
    }

    const cd = upstream.headers.get('content-disposition');
    let filename = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
    if (!filename) filename = decodeURIComponent(new URL(upstream.url).pathname.split('/').pop() || 'download.bin');

    res.setHeader('Access-Control-Allow-Origin', '*');
    for (const [k, v] of upstream.headers.entries()) if (passHeader(k) && v) res.setHeader(k, v);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    upstream.body.pipe(res);
  } catch (error) {
    res.status(500).send('Proxy error');
  }
});

// GET /api/v1/sources/resolve?url=ENCODED
app.get('/api/v1/sources/resolve', async (req, res) => {
  try {
    const raw = String(req.query.url || '');
    if (!raw) {
      res.status(400).json({ error: 'Missing url' });
      return;
    }
    if (!isAllowed(raw)) {
      res.status(400).json({ error: 'Host not allowed' });
      return;
    }

    const r = await fetch(raw, { method: 'HEAD' }).catch(() => fetch(raw, { method: 'GET' }));
    const finalUrl = r.url;
    const length = r.headers.get('content-length');
    const cd = r.headers.get('content-disposition');
    let filename = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
    if (!filename) filename = decodeURIComponent(new URL(finalUrl).pathname.split('/').pop() || 'download.bin');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ ok: r.ok, finalUrl, filename, sizeBytes: length ? Number(length) : null });
  } catch {
    res.status(500).json({ error: 'Resolve error' });
  }
});

export default app;
