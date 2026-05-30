import { Request, Response, NextFunction } from 'express';
export declare const neighborhoodController: {
    listPublic(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    listAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    remove(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=neighborhoodController.d.ts.map