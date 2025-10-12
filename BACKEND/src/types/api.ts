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
  stack?: string; // Only in development mode
}

/**
 * Response metadata
 */
export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  version: string;
  duration?: number; // Request duration in ms
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
export function successResponse<T>(
  data: T,
  meta?: Partial<ApiMeta>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
      ...meta
    }
  };
}

/**
 * Helper function to create error response
 */
export function errorResponse(
  message: string,
  code?: string,
  details?: any
): ApiResponse<never> {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    success: false,
    error: {
      message,
      code: code || 'INTERNAL_ERROR',
      details: isDev ? details : undefined,
      stack: isDev && details instanceof Error ? details.stack : undefined
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0'
    }
  };
}

/**
 * Helper function to create paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  meta?: Partial<ApiMeta>
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
      ...meta
    }
  };
}
