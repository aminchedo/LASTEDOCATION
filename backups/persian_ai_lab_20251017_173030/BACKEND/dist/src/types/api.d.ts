/**
 * Standardized API Response Types
 * Version: 1.0.0
 *
 * Use these types consistently across all API endpoints for uniform responses
 */
/**
 * Standard API response wrapper
 * @template T - The type of the data payload
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
}
/**
 * Error information structure
 */
export interface ApiError {
    message: string;
    code?: string;
    details?: any;
    stack?: string;
}
/**
 * Response metadata
 */
export interface ApiMeta {
    timestamp: string;
    requestId?: string;
    version: string;
    duration?: number;
}
/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
/**
 * Health check response
 */
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: {
        [key: string]: {
            status: 'healthy' | 'unhealthy';
            message: string;
            details?: any;
        };
    };
    timestamp: string;
    version: string;
}
/**
 * Helper function to create success response
 */
export declare function successResponse<T>(data: T, meta?: Partial<ApiMeta>): ApiResponse<T>;
/**
 * Helper function to create error response
 */
export declare function errorResponse(message: string, code?: string, details?: any): ApiResponse<never>;
/**
 * Helper function to create paginated response
 */
export declare function paginatedResponse<T>(items: T[], page: number, limit: number, total: number, meta?: Partial<ApiMeta>): PaginatedResponse<T>;
//# sourceMappingURL=api.d.ts.map