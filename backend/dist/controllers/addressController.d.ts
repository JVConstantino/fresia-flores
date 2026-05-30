import { Request, Response, NextFunction } from 'express';
export declare const addressController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    remove(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=addressController.d.ts.map