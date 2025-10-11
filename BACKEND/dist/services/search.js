"use strict";
/**
 * Custom Search API Service
 * Integrates external search API as first-class tool for Persian chat
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.SearchResponseSchema = exports.SearchRequestSchema = void 0;
const logger_1 = require("../middleware/logger");
const zod_1 = require("zod");
// Search request validation schema
exports.SearchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(500),
    language: zod_1.z.string().default('fa'),
    maxResults: zod_1.z.number().min(1).max(20).default(5),
    includeSnippets: zod_1.z.boolean().default(true),
    timeout: zod_1.z.number().min(1000).max(10000).default(5000)
});
exports.SearchResponseSchema = zod_1.z.object({
    results: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        url: zod_1.z.string().url(),
        snippet: zod_1.z.string().optional(),
        relevanceScore: zod_1.z.number().min(0).max(1),
        source: zod_1.z.string(),
        timestamp: zod_1.z.string()
    })),
    totalResults: zod_1.z.number(),
    query: zod_1.z.string(),
    language: zod_1.z.string(),
    processingTime: zod_1.z.number()
});
class SearchService {
    constructor() {
        this.isInitialized = false;
        this.config = {
            apiKey: process.env.SEARCH_API_KEY,
            baseUrl: process.env.SEARCH_API_URL || 'https://api.example.com/search',
            timeout: 5000,
            maxRetries: 3,
            retryDelay: 1000
        };
        this.initialize();
    }
    async initialize() {
        try {
            logger_1.logger.info({
                msg: 'search_service_initializing',
                baseUrl: this.config.baseUrl,
                hasApiKey: !!this.config.apiKey
            });
            // Simulate API connection test
            await new Promise(resolve => setTimeout(resolve, 500));
            this.isInitialized = true;
            logger_1.logger.info({ msg: 'search_service_initialized' });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'search_service_init_failed',
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Search for information using external API
     */
    async search(request) {
        if (!this.isInitialized) {
            throw new Error('Search service not initialized');
        }
        const startTime = Date.now();
        try {
            // Validate request
            const validatedRequest = exports.SearchRequestSchema.parse(request);
            logger_1.logger.info({
                msg: 'search_request_started',
                query: validatedRequest.query.substring(0, 50) + '...',
                language: validatedRequest.language,
                maxResults: validatedRequest.maxResults
            });
            // Simulate search API call
            const results = await this.simulateSearch(validatedRequest);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info({
                msg: 'search_request_completed',
                totalResults: results.length,
                processingTime: processingTime
            });
            return {
                results: results,
                totalResults: results.length,
                query: validatedRequest.query,
                language: validatedRequest.language,
                processingTime: processingTime
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.logger.error({
                msg: 'search_request_failed',
                error: error.message,
                processingTime: processingTime
            });
            throw error;
        }
    }
    /**
     * Simulate search API call with Persian results
     */
    async simulateSearch(request) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        // Generate simulated search results based on query
        const query = request.query.toLowerCase();
        const results = [];
        // Persian knowledge base samples
        const knowledgeBase = [
            {
                title: 'تاریخ ایران و تمدن پارسی',
                url: 'https://fa.wikipedia.org/wiki/تاریخ_ایران',
                snippet: 'ایران دارای تمدنی کهن و غنی است که قدمت آن به هزاران سال می‌رسد.',
                source: 'ویکی‌پدیا فارسی'
            },
            {
                title: 'ادبیات فارسی و شاعران بزرگ',
                url: 'https://fa.wikipedia.org/wiki/ادبیات_فارسی',
                snippet: 'ادبیات فارسی یکی از غنی‌ترین ادبیات‌های جهان است.',
                source: 'ویکی‌پدیا فارسی'
            },
            {
                title: 'فناوری و نوآوری در ایران',
                url: 'https://example.com/iran-tech',
                snippet: 'ایران در زمینه‌های مختلف فناوری پیشرفت‌های قابل توجهی داشته است.',
                source: 'پایگاه خبری فناوری'
            },
            {
                title: 'آموزش و پرورش در ایران',
                url: 'https://example.com/iran-education',
                snippet: 'سیستم آموزشی ایران دارای ساختار منظم و پیشرفته‌ای است.',
                source: 'وزارت آموزش و پرورش'
            },
            {
                title: 'اقتصاد و تجارت در ایران',
                url: 'https://example.com/iran-economy',
                snippet: 'اقتصاد ایران بر پایه نفت، گاز و صنایع مختلف استوار است.',
                source: 'بانک مرکزی ایران'
            },
            {
                title: 'فرهنگ و هنر ایرانی',
                url: 'https://example.com/iran-culture',
                snippet: 'فرهنگ ایرانی ترکیبی از سنت‌های کهن و مدرن است.',
                source: 'سازمان میراث فرهنگی'
            },
            {
                title: 'علم و دانش در ایران',
                url: 'https://example.com/iran-science',
                snippet: 'ایران در زمینه‌های مختلف علمی پیشرفت‌های چشمگیری داشته است.',
                source: 'آکادمی علوم ایران'
            },
            {
                title: 'ورزش و المپیک در ایران',
                url: 'https://example.com/iran-sports',
                snippet: 'ورزش در ایران دارای جایگاه ویژه‌ای در جامعه است.',
                source: 'کمیته ملی المپیک'
            }
        ];
        // Filter results based on query keywords
        const filteredResults = knowledgeBase.filter(item => {
            const searchText = (item.title + ' ' + item.snippet).toLowerCase();
            return searchText.includes(query) ||
                query.split(' ').some(keyword => searchText.includes(keyword));
        });
        // If no specific matches, return general results
        const selectedResults = filteredResults.length > 0 ?
            filteredResults : knowledgeBase.slice(0, request.maxResults);
        // Generate results with relevance scores
        selectedResults.slice(0, request.maxResults).forEach((item, index) => {
            results.push({
                title: item.title,
                url: item.url,
                snippet: request.includeSnippets ? item.snippet : undefined,
                relevanceScore: 0.9 - (index * 0.1), // Decreasing relevance
                source: item.source,
                timestamp: new Date().toISOString()
            });
        });
        return results;
    }
    /**
     * Get search service status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            config: this.config
        };
    }
    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return ['fa', 'fa-IR', 'en']; // Persian and English
    }
    /**
     * Validate Persian query
     */
    validatePersianQuery(query) {
        const issues = [];
        // Check for Persian characters
        const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        if (!persianRegex.test(query)) {
            issues.push('Query does not contain Persian characters');
        }
        // Check query length
        if (query.length < 3) {
            issues.push('Query too short (minimum 3 characters)');
        }
        if (query.length > 500) {
            issues.push('Query too long (maximum 500 characters)');
        }
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
    /**
     * Build context window from search results
     */
    buildContextWindow(results, maxLength = 2000) {
        let context = '';
        results.forEach((result, index) => {
            const resultText = `${index + 1}. ${result.title}\n${result.snippet || ''}\nمنبع: ${result.source}\n\n`;
            if (context.length + resultText.length <= maxLength) {
                context += resultText;
            }
        });
        return context.trim();
    }
}
// Export singleton instance
exports.searchService = new SearchService();
exports.default = exports.searchService;
//# sourceMappingURL=search.js.map