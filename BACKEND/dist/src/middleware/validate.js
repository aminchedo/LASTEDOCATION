"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.sanitizeQuery = exports.idParamSchema = exports.paginationSchema = exports.datasetSchema = exports.searchSchema = exports.tokenValidationSchema = exports.settingsSchema = exports.trainingSchema = exports.downloadSchema = exports.loginSchema = exports.registerSchema = exports.uuidSchema = exports.urlSchema = exports.emailSchema = exports.validate = void 0;
const zod_1 = require("zod");
const error_handler_1 = require("./error-handler");
/**
 * Generic validation middleware factory
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate and sanitize request body
            const validated = await schema.parseAsync(req.body);
            // Replace request body with validated/sanitized data
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                // Format Zod errors into readable format
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                    received: err.code === 'invalid_type' ? err.received : undefined
                }));
                const validationError = new error_handler_1.OperationalError('Validation failed. Please check your input.', 400, { errors: formattedErrors });
                validationError.name = 'ValidationError';
                validationError.details = formattedErrors;
                next(validationError);
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
/**
 * Email validation with sanitization
 */
exports.emailSchema = zod_1.z.string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim());
/**
 * URL validation
 */
exports.urlSchema = zod_1.z.string()
    .url('Invalid URL format')
    .transform(val => val.trim());
/**
 * UUID validation
 */
exports.uuidSchema = zod_1.z.string()
    .uuid('Invalid UUID format');
// ============================================
// Schema Definitions for API Endpoints
// ============================================
/**
 * User registration schema
 */
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    username: zod_1.z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
        .transform(val => val.trim()),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be at most 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});
/**
 * User login schema
 */
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required')
});
/**
 * Download request schema
 */
exports.downloadSchema = zod_1.z.object({
    repoId: zod_1.z.string()
        .min(1, 'Repository ID is required')
        .max(200, 'Repository ID too long')
        .regex(/^[\w-]+\/[\w-]+$/, 'Invalid repository ID format (expected: username/repo)')
        .transform(val => val.trim()),
    token: zod_1.z.string().optional()
        .refine(val => !val || val.startsWith('hf_'), 'HuggingFace token must start with hf_')
});
/**
 * Training job creation schema
 */
exports.trainingSchema = zod_1.z.object({
    datasetId: exports.uuidSchema,
    modelType: zod_1.z.enum(['simple', 'cnn', 'lstm', 'transformer'], {
        errorMap: () => ({ message: 'Invalid model type' })
    }),
    epochs: zod_1.z.number()
        .int('Epochs must be an integer')
        .min(1, 'Epochs must be at least 1')
        .max(1000, 'Epochs must be at most 1000'),
    batchSize: zod_1.z.number()
        .int('Batch size must be an integer')
        .min(1, 'Batch size must be at least 1')
        .max(512, 'Batch size must be at most 512'),
    learningRate: zod_1.z.number()
        .min(0.000001, 'Learning rate too small')
        .max(1, 'Learning rate too large'),
    validationSplit: zod_1.z.number()
        .min(0, 'Validation split must be between 0 and 1')
        .max(1, 'Validation split must be between 0 and 1')
        .default(0.2),
    optimizer: zod_1.z.enum(['adam', 'sgd', 'rmsprop']).optional().default('adam'),
    lossFunction: zod_1.z.string().optional()
});
/**
 * Settings update schema
 */
exports.settingsSchema = zod_1.z.object({
    huggingfaceToken: zod_1.z.string()
        .optional()
        .refine(val => !val || val.startsWith('hf_'), 'Invalid HuggingFace token format'),
    huggingfaceApiUrl: exports.urlSchema.optional(),
    autoDownload: zod_1.z.boolean().optional(),
    maxConcurrentDownloads: zod_1.z.number()
        .int()
        .min(1, 'Must allow at least 1 concurrent download')
        .max(10, 'Too many concurrent downloads')
        .optional(),
    settingsJson: zod_1.z.record(zod_1.z.any()).optional()
});
/**
 * HuggingFace token validation schema
 */
exports.tokenValidationSchema = zod_1.z.object({
    token: zod_1.z.string()
        .min(1, 'Token is required')
        .refine(val => val.startsWith('hf_'), 'Token must start with hf_')
});
/**
 * Model search schema
 */
exports.searchSchema = zod_1.z.object({
    q: zod_1.z.string()
        .min(1, 'Search query is required')
        .max(200, 'Search query too long')
        .transform(val => val.trim()),
    task: zod_1.z.string().optional(),
    library: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['downloads', 'likes', 'trending']).optional()
});
/**
 * Dataset creation schema
 */
exports.datasetSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, 'Dataset name is required')
        .max(200, 'Dataset name too long')
        .transform(val => val.trim()),
    type: zod_1.z.enum(['audio', 'text', 'csv', 'json']),
    filePath: zod_1.z.string().min(1, 'File path is required').transform(val => val.trim()),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
/**
 * Pagination schema
 */
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc')
});
/**
 * ID parameter validation
 */
exports.idParamSchema = zod_1.z.object({
    id: exports.uuidSchema
});
/**
 * Sanitize query parameters
 */
const sanitizeQuery = (query) => {
    const sanitized = {};
    for (const key in query) {
        if (query.hasOwnProperty(key)) {
            const value = query[key];
            // Convert to appropriate type
            if (value === 'true')
                sanitized[key] = true;
            else if (value === 'false')
                sanitized[key] = false;
            else if (!isNaN(Number(value)) && value !== '')
                sanitized[key] = Number(value);
            else if (typeof value === 'string')
                sanitized[key] = value.trim();
            else
                sanitized[key] = value;
        }
    }
    return sanitized;
};
exports.sanitizeQuery = sanitizeQuery;
/**
 * Validate query parameters middleware
 */
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            const sanitized = (0, exports.sanitizeQuery)(req.query);
            const validated = await schema.parseAsync(sanitized);
            req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                const validationError = new error_handler_1.OperationalError('Invalid query parameters', 400, { errors: formattedErrors });
                validationError.name = 'ValidationError';
                validationError.details = formattedErrors;
                next(validationError);
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Validate URL parameters middleware
 */
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.params);
            req.params = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                const validationError = new error_handler_1.OperationalError('Invalid URL parameters', 400, { errors: formattedErrors });
                validationError.name = 'ValidationError';
                validationError.details = formattedErrors;
                next(validationError);
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateParams = validateParams;
exports.default = exports.validate;
//# sourceMappingURL=validate.js.map