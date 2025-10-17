import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '../config/logger';

const ALLOWED_BASE_PATH = path.resolve(process.cwd(), 'storage', 'ai-lab');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = ['.csv', '.json', '.txt', '.jsonl', '.zip'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/json',
  'text/plain',
  'application/x-ndjson',
  'application/zip',
  'application/x-zip-compressed'
];

/**
 * Validate file upload
 */
export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    
    if (!file) {
      return next();
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      fs.unlink(file.path).catch(() => {});
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 100MB.' 
      });
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      fs.unlink(file.path).catch(() => {});
      return res.status(400).json({ 
        error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` 
      });
    }

    // Check MIME type
    if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      logger.warn(`Suspicious MIME type detected: ${file.mimetype} for file ${file.originalname}`);
    }

    next();
  } catch (error: any) {
    logger.error('File validation error:', error);
    res.status(500).json({ error: 'File validation failed' });
  }
}

/**
 * Validate and sanitize file paths
 */
export function sanitizePath(inputPath: string): string {
  // Remove any directory traversal attempts
  const cleaned = inputPath
    .split(/[/\\]/)
    .filter(part => part !== '..' && part !== '.')
    .join(path.sep);
  
  // Ensure the path is within allowed directory
  const resolved = path.resolve(ALLOWED_BASE_PATH, cleaned);
  
  if (!resolved.startsWith(ALLOWED_BASE_PATH)) {
    throw new Error('Invalid path: Outside allowed directory');
  }
  
  return resolved;
}

/**
 * Rate limiting for resource-intensive operations
 */
const operationCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_OPERATIONS = {
  training: 2,     // Max 2 training jobs per minute
  upload: 10,      // Max 10 uploads per minute
  export: 5        // Max 5 exports per minute
};

export function rateLimitOperation(operation: keyof typeof MAX_OPERATIONS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as any).user?.userId || 'anonymous';
    const key = `${userId}:${operation}`;
    const now = Date.now();
    
    let userOps = operationCounts.get(key);
    
    // Clean up old entries
    if (userOps && userOps.resetTime < now) {
      userOps = undefined;
    }
    
    if (!userOps) {
      userOps = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      operationCounts.set(key, userOps);
    }
    
    if (userOps.count >= MAX_OPERATIONS[operation]) {
      const remainingTime = Math.ceil((userOps.resetTime - now) / 1000);
      res.status(429).json({ 
        error: `Rate limit exceeded. Try again in ${remainingTime} seconds.` 
      });
      return;
    }
    
    userOps.count++;
    next();
  };
}

/**
 * Validate model configuration
 */
export function validateModelConfig(req: Request, res: Response, next: NextFunction): void {
  const config = req.body;
  
  // Validate layers
  if (config.layers && (config.layers < 1 || config.layers > 100)) {
    res.status(400).json({ 
      error: 'Invalid layer count. Must be between 1 and 100.' 
    });
    return;
  }
  
  // Validate custom layer configurations
  if (config.customLayers && Array.isArray(config.customLayers)) {
    for (const layer of config.customLayers) {
      if (!layer.type || typeof layer.type !== 'string') {
        res.status(400).json({ 
          error: 'Invalid layer configuration.' 
        });
        return;
      }
      
      // Prevent code injection
      if (layer.type.includes('eval') || layer.type.includes('Function')) {
        res.status(400).json({ 
          error: 'Invalid layer type.' 
        });
        return;
      }
    }
  }
  
  next();
}

/**
 * Clean up temporary files after request
 */
export function cleanupTempFiles(req: Request, res: Response, next: NextFunction) {
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    // Clean up any uploaded files on error
    if (res.statusCode >= 400 && req.file) {
      fs.unlink(req.file.path).catch(err => {
        logger.error('Failed to clean up temp file:', err);
      });
    }
    
    return originalEnd.call(res, chunk, encoding);
  } as any;
  
  next();
}

/**
 * Validate dataset content
 */
export async function validateDatasetContent(filePath: string, type: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    
    // Check file size
    if (stats.size === 0) {
      throw new Error('File is empty');
    }
    
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error('File too large');
    }
    
    // Basic content validation based on type
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.json' || ext === '.jsonl') {
      // Validate JSON structure
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (ext === '.json') {
        JSON.parse(content); // Will throw if invalid
      } else {
        // Validate each line is valid JSON
        for (const line of lines) {
          JSON.parse(line);
        }
      }
    }
    
    return true;
  } catch (error: any) {
    logger.error('Dataset validation failed:', error);
    return false;
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential script tags and SQL injection attempts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[';"]--/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
}