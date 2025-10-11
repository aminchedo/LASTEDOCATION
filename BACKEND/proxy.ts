import express from 'express';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Whitelist of allowed hosts
const ALLOWED_HOSTS = [
  'huggingface.co',
  'objects.githubusercontent.com',
  'raw.githubusercontent.com',
  'github.com',
  'storage.googleapis.com',
  'download.tensorflow.org'
];

// Helper function to check if URL is allowed
function isUrlAllowed(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_HOSTS.some(host => 
      parsedUrl.hostname === host || parsedUrl.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

// Helper function to extract filename from Content-Disposition header or URL
function extractFilename(contentDisposition: string | null, url: string): string {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  
  // Fallback to URL tail
  const urlParts = url.split('/');
  const tail = urlParts[urlParts.length - 1];
  return tail || 'download';
}

// Helper function to follow redirects
async function followRedirects(url: string, maxRedirects = 5): Promise<{ finalUrl: string; response: Response }> {
  let currentUrl = url;
  let redirectCount = 0;
  
  while (redirectCount < maxRedirects) {
    const response = await fetch(currentUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        currentUrl = location;
        redirectCount++;
        continue;
      }
    }
    
    return { finalUrl: currentUrl, response };
  }
  
  throw new Error('Too many redirects');
}

// Health endpoint
app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true });
});

// Resolve endpoint
app.get('/api/v1/sources/resolve', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({ 
        ok: false, 
        status: 400, 
        error: 'URL parameter is required' 
      });
      return;
    }
    
    const decodedUrl = decodeURIComponent(url);
    
    if (!isUrlAllowed(decodedUrl)) {
      res.status(403).json({ 
        ok: false, 
        status: 403, 
        error: 'Host not allowed' 
      });
      return;
    }
    
    // Add HuggingFace token if available
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    if (decodedUrl.includes('huggingface.co') && process.env.HF_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
    }
    
    try {
      const { finalUrl, response } = await followRedirects(decodedUrl);
      
      const filename = extractFilename(response.headers.get('content-disposition'), finalUrl);
      const contentLength = response.headers.get('content-length');
      const sizeBytes = contentLength ? parseInt(contentLength, 10) : null;
      
      res.json({
        ok: true,
        status: response.status,
        finalUrl,
        filename,
        sizeBytes
      });
      
    } catch (error) {
      // Fallback to GET request if HEAD fails
      try {
        const response = await fetch(decodedUrl, {
          method: 'GET',
          headers
        });
        
        const filename = extractFilename(response.headers.get('content-disposition'), decodedUrl);
        const contentLength = response.headers.get('content-length');
        const sizeBytes = contentLength ? parseInt(contentLength, 10) : null;
        
        res.json({
          ok: true,
          status: response.status,
          finalUrl: decodedUrl,
          filename,
          sizeBytes
        });
        
      } catch (fallbackError) {
        res.status(500).json({
          ok: false,
          status: 500,
          error: 'Failed to resolve URL'
        });
      }
    }
    
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({
      ok: false,
      status: 500,
      error: 'Internal server error'
    });
  }
});

// Proxy endpoint
app.get('/api/v1/sources/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL parameter is required' });
      return;
    }
    
    const decodedUrl = decodeURIComponent(url);
    
    if (!isUrlAllowed(decodedUrl)) {
      res.status(403).json({ error: 'Host not allowed' });
      return;
    }
    
    // Add HuggingFace token if available
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    if (decodedUrl.includes('huggingface.co') && process.env.HF_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
    }
    
    const response = await fetch(decodedUrl, {
      headers
    });
    
    if (!response.ok) {
      res.status(response.status).json({ 
        error: `Upstream error: ${response.status}` 
      });
      return;
    }
    
    // Pass through safe headers
    const safeHeaders = [
      'content-type',
      'content-length', 
      'content-disposition',
      'accept-ranges',
      'etag',
      'last-modified',
      'cache-control'
    ];
    
    safeHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        res.set(header, value);
      }
    });
    
    // Always set Content-Disposition with filename
    const filename = extractFilename(response.headers.get('content-disposition'), decodedUrl);
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the response
    if (response.body) {
      const reader = response.body.getReader();
      
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          console.error('Stream error:', error);
          res.end();
        }
      };
      
      pump();
    } else {
      res.end();
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔗 Resolve endpoint: http://localhost:${PORT}/api/v1/sources/resolve`);
  console.log(`⬇️  Proxy endpoint: http://localhost:${PORT}/api/v1/sources/proxy`);
});

export default app;
