import { z } from 'zod';
export declare const searchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    task: z.ZodOptional<z.ZodString>;
    library: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<["downloads", "likes", "trending"]>>;
}, "strip", z.ZodTypeAny, {
    q: string;
    sort?: "downloads" | "likes" | "trending" | undefined;
    task?: string | undefined;
    library?: string | undefined;
    language?: string | undefined;
}, {
    q: string;
    sort?: "downloads" | "likes" | "trending" | undefined;
    task?: string | undefined;
    library?: string | undefined;
    language?: string | undefined;
}>;
export declare const modelRepoIdSchema: z.ZodObject<{
    repoId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    repoId: string;
}, {
    repoId: string;
}>;
export declare const downloadRequestSchema: z.ZodObject<{
    repoId: z.ZodString;
    token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    repoId: string;
    token?: string | undefined;
}, {
    repoId: string;
    token?: string | undefined;
}>;
export declare const downloadIdParamSchema: z.ZodObject<{
    downloadId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    downloadId: string;
}, {
    downloadId: string;
}>;
export declare const tokenValidationSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const sourcesSchemas: {
    search: {
        query: z.ZodObject<{
            q: z.ZodString;
            task: z.ZodOptional<z.ZodString>;
            library: z.ZodOptional<z.ZodString>;
            language: z.ZodOptional<z.ZodString>;
            sort: z.ZodOptional<z.ZodEnum<["downloads", "likes", "trending"]>>;
        }, "strip", z.ZodTypeAny, {
            q: string;
            sort?: "downloads" | "likes" | "trending" | undefined;
            task?: string | undefined;
            library?: string | undefined;
            language?: string | undefined;
        }, {
            q: string;
            sort?: "downloads" | "likes" | "trending" | undefined;
            task?: string | undefined;
            library?: string | undefined;
            language?: string | undefined;
        }>;
    };
    getModel: {
        params: z.ZodObject<{
            repoId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            repoId: string;
        }, {
            repoId: string;
        }>;
    };
    startDownload: {
        body: z.ZodObject<{
            repoId: z.ZodString;
            token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            repoId: string;
            token?: string | undefined;
        }, {
            repoId: string;
            token?: string | undefined;
        }>;
    };
    getDownload: {
        params: z.ZodObject<{
            downloadId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            downloadId: string;
        }, {
            downloadId: string;
        }>;
    };
    cancelDownload: {
        params: z.ZodObject<{
            downloadId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            downloadId: string;
        }, {
            downloadId: string;
        }>;
    };
    validateToken: {
        body: z.ZodObject<{
            token: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            token: string;
        }, {
            token: string;
        }>;
    };
};
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type ModelRepoId = z.infer<typeof modelRepoIdSchema>;
export type DownloadRequest = z.infer<typeof downloadRequestSchema>;
export type DownloadIdParam = z.infer<typeof downloadIdParamSchema>;
export type TokenValidation = z.infer<typeof tokenValidationSchema>;
//# sourceMappingURL=sources.schema.d.ts.map