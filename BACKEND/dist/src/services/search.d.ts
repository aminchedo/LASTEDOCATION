/**
 * Custom Search API Service
 * Integrates external search API as first-class tool for Persian chat
 */
import { z } from 'zod';
export declare const SearchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    language: z.ZodDefault<z.ZodString>;
    maxResults: z.ZodDefault<z.ZodNumber>;
    includeSnippets: z.ZodDefault<z.ZodBoolean>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    language: string;
    query: string;
    maxResults: number;
    includeSnippets: boolean;
}, {
    query: string;
    timeout?: number | undefined;
    language?: string | undefined;
    maxResults?: number | undefined;
    includeSnippets?: boolean | undefined;
}>;
export declare const SearchResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        snippet: z.ZodOptional<z.ZodString>;
        relevanceScore: z.ZodNumber;
        source: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        source: string;
        timestamp: string;
        title: string;
        relevanceScore: number;
        snippet?: string | undefined;
    }, {
        url: string;
        source: string;
        timestamp: string;
        title: string;
        relevanceScore: number;
        snippet?: string | undefined;
    }>, "many">;
    totalResults: z.ZodNumber;
    query: z.ZodString;
    language: z.ZodString;
    processingTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    language: string;
    query: string;
    results: {
        url: string;
        source: string;
        timestamp: string;
        title: string;
        relevanceScore: number;
        snippet?: string | undefined;
    }[];
    totalResults: number;
    processingTime: number;
}, {
    language: string;
    query: string;
    results: {
        url: string;
        source: string;
        timestamp: string;
        title: string;
        relevanceScore: number;
        snippet?: string | undefined;
    }[];
    totalResults: number;
    processingTime: number;
}>;
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
declare class SearchService {
    private config;
    private isInitialized;
    constructor();
    private initialize;
    /**
     * Search for information using external API
     */
    search(request: SearchRequest): Promise<SearchResponse>;
    /**
     * Simulate search API call with Persian results
     */
    private simulateSearch;
    /**
     * Get search service status
     */
    getStatus(): {
        initialized: boolean;
        config: SearchConfig;
    };
    /**
     * Get supported languages
     */
    getSupportedLanguages(): string[];
    /**
     * Validate Persian query
     */
    validatePersianQuery(query: string): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Build context window from search results
     */
    buildContextWindow(results: SearchResult[], maxLength?: number): string;
}
export declare const searchService: SearchService;
export default searchService;
//# sourceMappingURL=search.d.ts.map