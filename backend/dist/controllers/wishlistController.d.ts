import { Request, Response, NextFunction } from 'express';
export declare const wishlistController: {
    getWishlist(req: Request, res: Response, next: NextFunction): Promise<void>;
    addToWishlist(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void>;
    syncWishlist(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=wishlistController.d.ts.map