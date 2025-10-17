import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationTarget {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
export declare function validate(schemas: ValidationTarget): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=validation.d.ts.map