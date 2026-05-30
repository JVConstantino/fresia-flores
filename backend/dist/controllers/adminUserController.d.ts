import { Request, Response, NextFunction } from 'express';
export declare const adminUserController: {
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    suspend(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    setTempPassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=adminUserController.d.ts.map