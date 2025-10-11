"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
const app = (0, express_1.default)();
const ALLOWED_HOSTS = new Set([
    'huggingface.co',
    'objects.githubusercontent.com',
    'raw.githubusercontent.com',
    'github.com',
    'storage.googleapis.com',
    'download.tensorflow.org'
]);
function isAllowed(target) {
    try {
        return ALLOWED_HOSTS.has(new url_1.URL(target).hostname);
    }
    catch {
        return false;
    }
}
function passHeader(name) {
    return ['content-type', 'content-length', 'content-disposition', 'accept-ranges', 'etag', 'last-modified', 'cache-control']
        .includes(name.toLowerCase());
}
async function follow(url, init = {}, limit = 5) {
    if (limit <= 0)
        throw new Error('Too many redirects');
    const res = await (0, node_fetch_1.default)(url, {
        ...init,
        redirect: 'manual',
        agent: (parsed) => parsed.protocol === 'http:' ? new http_1.default.Agent({ keepAlive: true }) : new https_1.default.Agent({ keepAlive: true })
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        const next = new url_1.URL(res.headers.get('location'), url).toString();
        return follow(next, init, limit - 1);
    }
    return res;
}
// GET /api/v1/sources/proxy?url=ENCODED
app.get('/api/v1/sources/proxy', async (req, res) => {
    const raw = String(req.query.url || '');
    if (!raw)
        return res.status(400).send('Missing url');
    if (!isAllowed(raw))
        return res.status(400).send('Host not allowed');
    const upstream = await follow(raw);
    if (!upstream.ok || !upstream.body)
        return res.status(upstream.status).send('Upstream error');
    const cd = upstream.headers.get('content-disposition');
    let filename = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
    if (!filename)
        filename = decodeURIComponent(new url_1.URL(upstream.url).pathname.split('/').pop() || 'download.bin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    for (const [k, v] of upstream.headers.entries())
        if (passHeader(k) && v)
            res.setHeader(k, v);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    upstream.body.pipe(res);
});
// GET /api/v1/sources/resolve?url=ENCODED
app.get('/api/v1/sources/resolve', async (req, res) => {
    try {
        const raw = String(req.query.url || '');
        if (!raw)
            return res.status(400).json({ error: 'Missing url' });
        if (!isAllowed(raw))
            return res.status(400).json({ error: 'Host not allowed' });
        const r = await follow(raw, { method: 'HEAD' }).catch(() => follow(raw, { method: 'GET' }));
        const finalUrl = r.url;
        const length = r.headers.get('content-length');
        const cd = r.headers.get('content-disposition');
        let filename = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
        if (!filename)
            filename = decodeURIComponent(new url_1.URL(finalUrl).pathname.split('/').pop() || 'download.bin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json({ ok: r.ok, finalUrl, filename, sizeBytes: length ? Number(length) : null });
    }
    catch {
        res.status(500).json({ error: 'Resolve error' });
    }
});
exports.default = app;
//# sourceMappingURL=download-proxy.js.map