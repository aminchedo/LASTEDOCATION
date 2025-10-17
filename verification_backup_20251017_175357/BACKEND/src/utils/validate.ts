import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse((req as any)[source]);
    if (!parsed.success) {
      res.status(400).json({
        error: true,
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }
    (req as any).validated = parsed.data;
    next();
  };
