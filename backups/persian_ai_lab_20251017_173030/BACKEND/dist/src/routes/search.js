"use strict";
/**
 * Search API Routes
 * Handles search requests and integrates with Persian chat
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const search_1 = require("../services/search");
const logger_1 = require("../middleware/logger");
const zod_1 = require("zod");
const router = express_1.default.Router();
/**
 * POST /api/search
 * Search for information using external API
 */
router.post('/', async (req, res) => {
    try {
        const startTime = Date.now();
        // Validate request body
        const bodySchema = zod_1.z.object({
            query: zod_1.z.string().min(1).max(500),
            language: zod_1.z.string().default('fa'),
            maxResults: zod_1.z.number().min(1).max(20).default(5),
            includeSnippets: zod_1.z.boolean().default(true),
            timeout: zod_1.z.number().min(1000).max(10000).default(5000)
        });
        const validatedBody = bodySchema.parse(req.body);
        logger_1.logger.info({
            msg: 'search_request_received',
            query: validatedBody.query.substring(0, 50) + '...',
            language: validatedBody.language,
            maxResults: validatedBody.maxResults
        });
        // Validate Persian query
        const queryValidation = search_1.searchService.validatePersianQuery(validatedBody.query);
        if (!queryValidation.valid) {
            logger_1.logger.warn({
                msg: 'search_persian_query_validation_failed',
                issues: queryValidation.issues,
                query: validatedBody.query.substring(0, 50) + '...'
            });
        }
        // Prepare search request
        const searchRequest = {
            query: validatedBody.query,
            language: validatedBody.language,
            maxResults: validatedBody.maxResults,
            includeSnippets: validatedBody.includeSnippets,
            timeout: validatedBody.timeout
        };
        // Perform search
        const result = await search_1.searchService.search(searchRequest);
        const processingTime = Date.now() - startTime;
        logger_1.logger.info({
            msg: 'search_request_completed',
            totalResults: result.totalResults,
            processingTime: processingTime
        });
        res.json({
            error: false,
            data: result,
            processingTime: processingTime
        });
    }
    catch (error) {
        const processingTime = Date.now() - req.startTime || Date.now();
        logger_1.logger.error({
            msg: 'search_request_failed',
            error: error.message,
            processingTime: processingTime
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'SEARCH_PROCESSING_ERROR',
            processingTime: processingTime
        });
    }
});
/**
 * POST /api/search/context
 * Build context window from search results for LLM
 */
router.post('/context', async (req, res) => {
    try {
        const startTime = Date.now();
        // Validate request body
        const bodySchema = zod_1.z.object({
            query: zod_1.z.string().min(1).max(500),
            maxLength: zod_1.z.number().min(500).max(5000).default(2000),
            language: zod_1.z.string().default('fa')
        });
        const validatedBody = bodySchema.parse(req.body);
        logger_1.logger.info({
            msg: 'search_context_request_received',
            query: validatedBody.query.substring(0, 50) + '...',
            maxLength: validatedBody.maxLength
        });
        // Perform search
        const searchResult = await search_1.searchService.search({
            query: validatedBody.query,
            language: validatedBody.language,
            maxResults: 10,
            includeSnippets: true,
            timeout: 5000
        });
        // Build context window
        const context = search_1.searchService.buildContextWindow(searchResult.results, validatedBody.maxLength);
        const processingTime = Date.now() - startTime;
        logger_1.logger.info({
            msg: 'search_context_completed',
            contextLength: context.length,
            resultsUsed: searchResult.results.length,
            processingTime: processingTime
        });
        res.json({
            error: false,
            data: {
                context: context,
                query: validatedBody.query,
                resultsCount: searchResult.results.length,
                contextLength: context.length,
                maxLength: validatedBody.maxLength
            },
            processingTime: processingTime
        });
    }
    catch (error) {
        const processingTime = Date.now() - req.startTime || Date.now();
        logger_1.logger.error({
            msg: 'search_context_failed',
            error: error.message,
            processingTime: processingTime
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'SEARCH_CONTEXT_ERROR',
            processingTime: processingTime
        });
    }
});
/**
 * GET /api/search/status
 * Get search service status and capabilities
 */
router.get('/status', async (_req, res) => {
    try {
        const status = search_1.searchService.getStatus();
        const supportedLanguages = search_1.searchService.getSupportedLanguages();
        res.json({
            error: false,
            data: {
                status: status,
                capabilities: {
                    supportedLanguages: supportedLanguages,
                    maxQueryLength: 500,
                    maxResults: 20,
                    timeout: 10000
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'search_status_request_failed',
            error: error.message
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'SEARCH_STATUS_ERROR'
        });
    }
});
/**
 * GET /api/search/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
    res.json({
        error: false,
        status: 'healthy',
        service: 'search',
        timestamp: new Date().toISOString()
    });
});
/**
 * POST /api/search/validate
 * Validate Persian query for search
 */
router.post('/validate', async (req, res) => {
    try {
        const bodySchema = zod_1.z.object({
            query: zod_1.z.string().min(1).max(500)
        });
        const validatedBody = bodySchema.parse(req.body);
        const validation = search_1.searchService.validatePersianQuery(validatedBody.query);
        res.json({
            error: false,
            data: {
                query: validatedBody.query,
                validation: validation,
                characterCount: validatedBody.query.length,
                wordCount: validatedBody.query.split(' ').length
            }
        });
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'search_validate_request_failed',
            error: error.message
        });
        res.status(500).json({
            error: true,
            message: error.message,
            code: 'SEARCH_VALIDATE_ERROR'
        });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map