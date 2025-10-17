import { Request, Response, NextFunction } from 'express';
/**
 * Validate file upload
 */
export declare function validateFileUpload(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Validate and sanitize file paths
 */
export declare function sanitizePath(inputPath: string): string;
declare const MAX_OPERATIONS: {
    training: number;
    upload: number;
    export: number;
};
export declare function rateLimitOperation(operation: keyof typeof MAX_OPERATIONS): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate model configuration
 */
export declare function validateModelConfig(req: Request, res: Response, next: NextFunction): void;
/**
 * Clean up temporary files after request
 */
export declare function cleanupTempFiles(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate dataset content
 */
export declare function validateDatasetContent(filePath: string, type: string): Promise<boolean>;
/**
 * Sanitize user input
 */
export declare function sanitizeInput(input: any): any;
export {};
//# sourceMappingURL=ai-lab-security.d.ts.map