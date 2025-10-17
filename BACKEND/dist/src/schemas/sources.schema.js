"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourcesSchemas = exports.tokenValidationSchema = exports.downloadIdParamSchema = exports.downloadRequestSchema = exports.modelRepoIdSchema = exports.searchQuerySchema = void 0;
const zod_1 = require("zod");
// Search query schema
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().min(1, 'Search query is required'),
    task: zod_1.z.string().optional(),
    library: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['downloads', 'likes', 'trending']).optional()
});
// Model repo ID parameter schema
exports.modelRepoIdSchema = zod_1.z.object({
    repoId: zod_1.z.string().min(1, 'Repository ID is required')
});
// Download request schema
exports.downloadRequestSchema = zod_1.z.object({
    repoId: zod_1.z.string().min(1, 'Repository ID is required'),
    token: zod_1.z.string().optional()
});
// Download ID parameter schema
exports.downloadIdParamSchema = zod_1.z.object({
    downloadId: zod_1.z.string().uuid('Invalid download ID format')
});
// Token validation schema
exports.tokenValidationSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required')
});
// Sources schemas for route validation
exports.sourcesSchemas = {
    search: {
        query: exports.searchQuerySchema
    },
    getModel: {
        params: exports.modelRepoIdSchema
    },
    startDownload: {
        body: exports.downloadRequestSchema
    },
    getDownload: {
        params: exports.downloadIdParamSchema
    },
    cancelDownload: {
        params: exports.downloadIdParamSchema
    },
    validateToken: {
        body: exports.tokenValidationSchema
    }
};
//# sourceMappingURL=sources.schema.js.map