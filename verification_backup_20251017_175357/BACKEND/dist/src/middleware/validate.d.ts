/**
 * Request Validation Middleware
 * Validates and sanitizes all incoming requests using Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
/**
 * Generic validation middleware factory
 */
export declare const validate: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Email validation with sanitization
 */
export declare const emailSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * URL validation
 */
export declare const urlSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * UUID validation
 */
export declare const uuidSchema: z.ZodString;
/**
 * User registration schema
 */
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    username: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    email: string;
}, {
    password: string;
    username: string;
    email: string;
}>;
/**
 * User login schema
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
/**
 * Download request schema
 */
export declare const downloadSchema: z.ZodObject<{
    repoId: z.ZodEffects<z.ZodString, string, string>;
    token: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    repoId: string;
    token?: string | undefined;
}, {
    repoId: string;
    token?: string | undefined;
}>;
/**
 * Training job creation schema
 */
export declare const trainingSchema: z.ZodObject<{
    datasetId: z.ZodString;
    modelType: z.ZodEnum<["simple", "cnn", "lstm", "transformer"]>;
    epochs: z.ZodNumber;
    batchSize: z.ZodNumber;
    learningRate: z.ZodNumber;
    validationSplit: z.ZodDefault<z.ZodNumber>;
    optimizer: z.ZodDefault<z.ZodOptional<z.ZodEnum<["adam", "sgd", "rmsprop"]>>>;
    lossFunction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    datasetId: string;
    epochs: number;
    batchSize: number;
    validationSplit: number;
    learningRate: number;
    modelType: "simple" | "cnn" | "lstm" | "transformer";
    optimizer: "adam" | "sgd" | "rmsprop";
    lossFunction?: string | undefined;
}, {
    datasetId: string;
    epochs: number;
    batchSize: number;
    learningRate: number;
    modelType: "simple" | "cnn" | "lstm" | "transformer";
    validationSplit?: number | undefined;
    optimizer?: "adam" | "sgd" | "rmsprop" | undefined;
    lossFunction?: string | undefined;
}>;
/**
 * Settings update schema
 */
export declare const settingsSchema: z.ZodObject<{
    huggingfaceToken: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    huggingfaceApiUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    autoDownload: z.ZodOptional<z.ZodBoolean>;
    maxConcurrentDownloads: z.ZodOptional<z.ZodNumber>;
    settingsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    huggingfaceToken?: string | undefined;
    huggingfaceApiUrl?: string | undefined;
    autoDownload?: boolean | undefined;
    maxConcurrentDownloads?: number | undefined;
    settingsJson?: Record<string, any> | undefined;
}, {
    huggingfaceToken?: string | undefined;
    huggingfaceApiUrl?: string | undefined;
    autoDownload?: boolean | undefined;
    maxConcurrentDownloads?: number | undefined;
    settingsJson?: Record<string, any> | undefined;
}>;
/**
 * HuggingFace token validation schema
 */
export declare const tokenValidationSchema: z.ZodObject<{
    token: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
/**
 * Model search schema
 */
export declare const searchSchema: z.ZodObject<{
    q: z.ZodEffects<z.ZodString, string, string>;
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
/**
 * Dataset creation schema
 */
export declare const datasetSchema: z.ZodObject<{
    name: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodEnum<["audio", "text", "csv", "json"]>;
    filePath: z.ZodEffects<z.ZodString, string, string>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "audio" | "json" | "csv";
    name: string;
    filePath: string;
    metadata?: Record<string, any> | undefined;
}, {
    type: "text" | "audio" | "json" | "csv";
    name: string;
    filePath: string;
    metadata?: Record<string, any> | undefined;
}>;
/**
 * Pagination schema
 */
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
/**
 * ID parameter validation
 */
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Sanitize query parameters
 */
export declare const sanitizeQuery: (query: any) => any;
/**
 * Validate query parameters middleware
 */
export declare const validateQuery: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validate URL parameters middleware
 */
export declare const validateParams: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default validate;
//# sourceMappingURL=validate.d.ts.map