import { Request, Response, NextFunction } from 'express';
export declare const cardController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    remove(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=cardController.d.ts.map