import { z } from 'zod';

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  task: z.string().optional(),
  library: z.string().optional(),
  language: z.string().optional(),
  sort: z.enum(['downloads', 'likes', 'trending']).optional()
});

// Model repo ID parameter schema
export const modelRepoIdSchema = z.object({
  repoId: z.string().min(1, 'Repository ID is required')
});

// Download request schema
export const downloadRequestSchema = z.object({
  repoId: z.string().min(1, 'Repository ID is required'),
  token: z.string().optional()
});

// Download ID parameter schema
export const downloadIdParamSchema = z.object({
  downloadId: z.string().uuid('Invalid download ID format')
});

// Token validation schema
export const tokenValidationSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// Sources schemas for route validation
export const sourcesSchemas = {
  search: {
    query: searchQuerySchema
  },
  getModel: {
    params: modelRepoIdSchema
  },
  startDownload: {
    body: downloadRequestSchema
  },
  getDownload: {
    params: downloadIdParamSchema
  },
  cancelDownload: {
    params: downloadIdParamSchema
  },
  validateToken: {
    body: tokenValidationSchema
  }
};

// Export types
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type ModelRepoId = z.infer<typeof modelRepoIdSchema>;
export type DownloadRequest = z.infer<typeof downloadRequestSchema>;
export type DownloadIdParam = z.infer<typeof downloadIdParamSchema>;
export type TokenValidation = z.infer<typeof tokenValidationSchema>;