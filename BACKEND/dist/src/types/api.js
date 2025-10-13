"use strict";
/**
 * Standardized API Response Types
 * Version: 1.0.0
 *
 * Use these types consistently across all API endpoints for uniform responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.paginatedResponse = paginatedResponse;
/**
 * Helper function to create success response
 */
function successResponse(data, meta) {
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
function errorResponse(message, code, details) {
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
function paginatedResponse(items, page, limit, total, meta) {
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
//# sourceMappingURL=api.js.map