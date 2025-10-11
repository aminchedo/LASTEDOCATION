"use strict";
// BACKEND/src/simple-proxy.ts - FIXED VERSION
// @ts-nocheck - Disable strict returns for Express handlers
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const url_1 = require("url");
const app = (0, express_1.default)();
// ✅ EXPANDED: Added HuggingFace CDN domains
const ALLOWED_HOSTS = new Set([
    'huggingface.co',
    'cdn-lfs.huggingface.co', // ✅ NEW: HuggingFace LFS CDN
    'cdn-lfs-us-1.huggingface.co', // ✅ NEW: HuggingFace US CDN
    'cdn.huggingface.co', // ✅ NEW: HuggingFace CDN
    'objects.githubusercontent.com',
    'raw.githubusercontent.com',
    'github.com',
    'storage.googleapis.com',
    'download.tensorflow.org',
    'kaggle.com', // ✅ NEW: Kaggle datasets
    'www.kaggle.com' // ✅ NEW: Kaggle www
]);
/**
 * Check if URL is from an allowed domain
 */
function isAllowed(target) {
    try {
        const hostname = new url_1.URL(target).hostname;
        // Direct match
        if (ALLOWED_HOSTS.has(hostname)) {
            return true;
        }
        // Check subdomains (e.g., *.huggingface.co)
        for (const allowedHost of ALLOWED_HOSTS) {
            if (hostname === allowedHost || hostname.endsWith('.' + allowedHost)) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        return false;
    }
}
/**
 * Check if header should be passed through
 */
function passHeader(name) {
    const allowedHeaders = [
        'content-type',
        'content-length',
        'content-disposition',
        'accept-ranges',
        'etag',
        'last-modified',
        'cache-control',
        'content-encoding'
    ];
    return allowedHeaders.includes(name.toLowerCase());
}
/**
 * Extract filename from Content-Disposition header or URL
 */
function extractFilename(contentDisposition, url) {
    if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
        if (match && match[1]) {
            return decodeURIComponent(match[1]);
        }
    }
    // Fallback to URL
    const urlObj = new url_1.URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const filename = parts[parts.length - 1];
    return filename || 'download.bin';
}
/**
 * Follow redirects and get final URL
 */
async function followRedirects(url, maxRedirects = 5) {
    let currentUrl = url;
    let redirectCount = 0;
    while (redirectCount < maxRedirects) {
        try {
            const response = await (0, node_fetch_1.default)(currentUrl, {
                method: 'HEAD',
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (location) {
                    currentUrl = location.startsWith('http') ? location : new url_1.URL(location, currentUrl).toString();
                    redirectCount++;
                    continue;
                }
            }
            return currentUrl;
        }
        catch (error) {
            return currentUrl;
        }
    }
    return currentUrl;
}
// ====== PROXY ENDPOINT ======
// GET /api/v1/sources/proxy?url=ENCODED
app.get('/api/v1/sources/proxy', async (req, res) => {
    const raw = String(req.query.url || '');
    if (!raw) {
        return res.status(400).json({
            error: 'Missing url parameter',
            usage: '/api/v1/sources/proxy?url=ENCODED_URL'
        });
    }
    // Decode URL
    let targetUrl;
    try {
        targetUrl = decodeURIComponent(raw);
    }
    catch (error) {
        return res.status(400).json({
            error: 'Invalid URL encoding',
            url: raw
        });
    }
    // Check if allowed
    if (!isAllowed(targetUrl)) {
        return res.status(403).json({
            error: 'Host not allowed',
            url: targetUrl,
            allowedHosts: Array.from(ALLOWED_HOSTS)
        });
    }
    try {
        // Follow redirects to get final URL
        const finalUrl = await followRedirects(targetUrl);
        // Fetch the file
        const upstream = await (0, node_fetch_1.default)(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        if (!upstream.ok || !upstream.body) {
            return res.status(upstream.status).json({
                error: `Upstream error: ${upstream.status} ${upstream.statusText}`,
                url: finalUrl
            });
        }
        // Extract filename
        const filename = extractFilename(upstream.headers.get('content-disposition'), finalUrl);
        // Set response headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        // Pass through safe headers
        for (const [key, value] of upstream.headers.entries()) {
            if (passHeader(key) && value) {
                res.setHeader(key, value);
            }
        }
        // Always set Content-Disposition
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Pipe response
        upstream.body.pipe(res);
    }
    catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            url: targetUrl
        });
    }
});
// ====== RESOLVE ENDPOINT ======
// GET /api/v1/sources/resolve?url=ENCODED
app.get('/api/v1/sources/resolve', async (req, res) => {
    const raw = String(req.query.url || '');
    if (!raw) {
        return res.status(400).json({
            error: 'Missing url parameter',
            usage: '/api/v1/sources/resolve?url=ENCODED_URL'
        });
    }
    // Decode URL
    let targetUrl;
    try {
        targetUrl = decodeURIComponent(raw);
    }
    catch (error) {
        return res.status(400).json({
            error: 'Invalid URL encoding',
            url: raw
        });
    }
    // Check if allowed
    if (!isAllowed(targetUrl)) {
        return res.status(403).json({
            error: 'Host not allowed',
            url: targetUrl,
            allowedHosts: Array.from(ALLOWED_HOSTS)
        });
    }
    try {
        // Follow redirects
        const finalUrl = await followRedirects(targetUrl);
        // Try HEAD request first
        let response;
        try {
            response = await (0, node_fetch_1.default)(finalUrl, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
        }
        catch (error) {
            // Fallback to GET if HEAD fails
            response = await (0, node_fetch_1.default)(finalUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
        }
        const contentLength = response.headers.get('content-length');
        const filename = extractFilename(response.headers.get('content-disposition'), finalUrl);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json({
            ok: response.ok,
            status: response.status,
            finalUrl: finalUrl,
            filename: filename,
            sizeBytes: contentLength ? parseInt(contentLength, 10) : null,
            contentType: response.headers.get('content-type')
        });
    }
    catch (error) {
        console.error('Resolve error:', error);
        return res.status(500).json({
            error: 'Resolve error',
            message: error.message,
            url: targetUrl
        });
    }
});
// ====== CORS PREFLIGHT ======
app.options('*', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});
// ====== HEALTH CHECK ======
app.get('/api/v1/health', (_req, res) => {
    res.json({
        ok: true,
        service: 'download-proxy',
        allowedHosts: Array.from(ALLOWED_HOSTS)
    });
});
exports.default = app;
//# sourceMappingURL=simple-proxy.js.map