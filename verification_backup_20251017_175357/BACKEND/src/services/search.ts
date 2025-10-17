/**
 * Custom Search API Service
 * Integrates external search API as first-class tool for Persian chat
 */

import { logger } from '../middleware/logger';
import { z } from 'zod';

// Search request validation schema
export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  language: z.string().default('fa'),
  maxResults: z.number().min(1).max(20).default(5),
  includeSnippets: z.boolean().default(true),
  timeout: z.number().min(1000).max(10000).default(5000)
});

export const SearchResponseSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    snippet: z.string().optional(),
    relevanceScore: z.number().min(0).max(1),
    source: z.string(),
    timestamp: z.string()
  })),
  totalResults: z.number(),
  query: z.string(),
  language: z.string(),
  processingTime: z.number()
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

interface SearchConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  relevanceScore: number;
  source: string;
  timestamp: string;
}

class SearchService {
  private config: SearchConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      apiKey: process.env.SEARCH_API_KEY,
      baseUrl: process.env.SEARCH_API_URL || 'https://api.example.com/search',
      timeout: 5000,
      maxRetries: 3,
      retryDelay: 1000
    };
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.info({ 
        msg: 'search_service_initializing',
        baseUrl: this.config.baseUrl,
        hasApiKey: !!this.config.apiKey
      });

      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 500));

      this.isInitialized = true;
      logger.info({ msg: 'search_service_initialized' });
    } catch (error: any) {
      logger.error({ 
        msg: 'search_service_init_failed', 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Search for information using external API
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = SearchRequestSchema.parse(request);
      
      logger.info({ 
        msg: 'search_request_started',
        query: validatedRequest.query.substring(0, 50) + '...',
        language: validatedRequest.language,
        maxResults: validatedRequest.maxResults
      });

      // Simulate search API call
      const results = await this.simulateSearch(validatedRequest);
      
      const processingTime = Date.now() - startTime;
      
      logger.info({ 
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

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logger.error({ 
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
  private async simulateSearch(request: SearchRequest): Promise<SearchResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Generate simulated search results based on query
    const query = request.query.toLowerCase();
    const results: SearchResult[] = [];

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
  getStatus(): { initialized: boolean; config: SearchConfig } {
    return {
      initialized: this.isInitialized,
      config: this.config
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return ['fa', 'fa-IR', 'en']; // Persian and English
  }

  /**
   * Validate Persian query
   */
  validatePersianQuery(query: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
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
  buildContextWindow(results: SearchResult[], maxLength: number = 2000): string {
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
export const searchService = new SearchService();
export default searchService;