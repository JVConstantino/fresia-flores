import { Request, Response, NextFunction } from 'express';
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
export declare function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=authMiddleware.d.ts.map