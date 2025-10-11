import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const validate: <T>(schema: ZodSchema<T>, source?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map