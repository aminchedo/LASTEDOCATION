import { Request, Response, NextFunction } from 'express';
interface TokenPayload {
    userId: string;
    role: 'admin' | 'user';
    username: string;
    exp: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const generateToken: (payload: Omit<TokenPayload, "exp">) => string;
export declare const verifyToken: (token: string) => TokenPayload | null;
export {};
//# sourceMappingURL=auth.d.ts.map