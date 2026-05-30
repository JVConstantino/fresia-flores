import { Request, Response, NextFunction } from 'express';
export declare const productController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    featured(req: Request, res: Response, next: NextFunction): Promise<void>;
    detail(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=productController.d.ts.map