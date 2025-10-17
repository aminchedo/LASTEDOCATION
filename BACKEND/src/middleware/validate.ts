/**
 * Request Validation Middleware
 * Validates and sanitizes all incoming requests using Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { OperationalError } from './error-handler';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and sanitize request body
      const validated = await schema.parseAsync(req.body);
      
      // Replace request body with validated/sanitized data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into readable format
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as any).received : undefined
        }));

        const validationError = new OperationalError(
          'Validation failed. Please check your input.',
          400,
          { errors: formattedErrors }
        );
        
        (validationError as any).name = 'ValidationError';
        (validationError as any).details = formattedErrors;
        
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Email validation with sanitization
 */
export const emailSchema = z.string()
  .transform(val => val.trim().toLowerCase())
  .refine(val => z.string().email().safeParse(val).success, 'Invalid email format');

/**
 * URL validation
 */
export const urlSchema = z.string()
  .url('Invalid URL format')
  .transform(val => val.trim());

/**
 * UUID validation
 */
export const uuidSchema = z.string()
  .uuid('Invalid UUID format');

// ============================================
// Schema Definitions for API Endpoints
// ============================================

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  username: z.string()
    .transform(val => val.trim())
    .refine(val => val.length >= 3, 'Username must be at least 3 characters')
    .refine(val => val.length <= 50, 'Username must be at most 50 characters')
    .refine(val => /^[a-zA-Z0-9_-]+$/.test(val), 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

/**
 * Download request schema
 */
export const downloadSchema = z.object({
  repoId: z.string()
    .min(1, 'Repository ID is required')
    .max(200, 'Repository ID too long')
    .regex(/^[\w-]+\/[\w-]+$/, 'Invalid repository ID format (expected: username/repo)')
    .transform(val => val.trim()),
  token: z.string().optional()
    .refine(val => !val || val.startsWith('hf_'), 'HuggingFace token must start with hf_')
});

/**
 * Training job creation schema
 */
export const trainingSchema = z.object({
  datasetId: uuidSchema,
  modelType: z.enum(['simple', 'cnn', 'lstm', 'transformer'], {
    errorMap: () => ({ message: 'Invalid model type' })
  }),
  epochs: z.number()
    .int('Epochs must be an integer')
    .min(1, 'Epochs must be at least 1')
    .max(1000, 'Epochs must be at most 1000'),
  batchSize: z.number()
    .int('Batch size must be an integer')
    .min(1, 'Batch size must be at least 1')
    .max(512, 'Batch size must be at most 512'),
  learningRate: z.number()
    .min(0.000001, 'Learning rate too small')
    .max(1, 'Learning rate too large'),
  validationSplit: z.number()
    .min(0, 'Validation split must be between 0 and 1')
    .max(1, 'Validation split must be between 0 and 1')
    .default(0.2),
  optimizer: z.enum(['adam', 'sgd', 'rmsprop']).optional().default('adam'),
  lossFunction: z.string().optional()
});

/**
 * Settings update schema
 */
export const settingsSchema = z.object({
  huggingfaceToken: z.string()
    .optional()
    .refine(val => !val || val.startsWith('hf_'), 'Invalid HuggingFace token format'),
  huggingfaceApiUrl: urlSchema.optional(),
  autoDownload: z.boolean().optional(),
  maxConcurrentDownloads: z.number()
    .int()
    .min(1, 'Must allow at least 1 concurrent download')
    .max(10, 'Too many concurrent downloads')
    .optional(),
  settingsJson: z.record(z.any()).optional()
});

/**
 * HuggingFace token validation schema
 */
export const tokenValidationSchema = z.object({
  token: z.string()
    .min(1, 'Token is required')
    .refine(val => val.startsWith('hf_'), 'Token must start with hf_')
});

/**
 * Model search schema
 */
export const searchSchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long')
    .transform(val => val.trim()),
  task: z.string().optional(),
  library: z.string().optional(),
  language: z.string().optional(),
  sort: z.enum(['downloads', 'likes', 'trending']).optional()
});

/**
 * Dataset creation schema
 */
export const datasetSchema = z.object({
  name: z.string()
    .min(1, 'Dataset name is required')
    .max(200, 'Dataset name too long')
    .transform(val => val.trim()),
  type: z.enum(['audio', 'text', 'csv', 'json']),
  filePath: z.string().min(1, 'File path is required').transform(val => val.trim()),
  metadata: z.record(z.any()).optional()
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: uuidSchema
});

/**
 * Sanitize query parameters
 */
export const sanitizeQuery = (query: any): any => {
  const sanitized: any = {};
  
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];
      
      // Convert to appropriate type
      if (value === 'true') sanitized[key] = true;
      else if (value === 'false') sanitized[key] = false;
      else if (!isNaN(Number(value)) && value !== '') sanitized[key] = Number(value);
      else if (typeof value === 'string') sanitized[key] = value.trim();
      else sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate query parameters middleware
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sanitized = sanitizeQuery(req.query);
      const validated = await schema.parseAsync(sanitized);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const validationError = new OperationalError(
          'Invalid query parameters',
          400,
          { errors: formattedErrors }
        );
        
        (validationError as any).name = 'ValidationError';
        (validationError as any).details = formattedErrors;
        
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate URL parameters middleware
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const validationError = new OperationalError(
          'Invalid URL parameters',
          400,
          { errors: formattedErrors }
        );
        
        (validationError as any).name = 'ValidationError';
        (validationError as any).details = formattedErrors;
        
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export default validate;
