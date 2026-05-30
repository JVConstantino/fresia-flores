"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const productService_1 = require("../services/productService");
exports.productController = {
    async list(req, res, next) {
        try {
            let categoryIds;
            if (req.query.categoryId) {
                const ids = Array.isArray(req.query.categoryId) ? req.query.categoryId : [req.query.categoryId];
                categoryIds = ids.map(id => Number(id));
            }
            const sort = req.query.sort || 'newest';
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const excludeSlug = typeof req.query.exclude === 'string' ? req.query.exclude : undefined;
            const priceMin = req.query.priceMin ? Number(req.query.priceMin) : undefined;
            const priceMax = req.query.priceMax ? Number(req.query.priceMax) : undefined;
            const isFeatured = req.query.isFeatured === '1' ? true : undefined;
            const hasPromotion = req.query.hasPromotion === '1' ? true : undefined;
            const search = typeof req.query.search === 'string' ? req.query.search : undefined;
            const products = await productService_1.productService.findAll(categoryIds, sort, limit, excludeSlug, priceMin, priceMax, isFeatured, hasPromotion, search);
            res.json(products);
        }
        catch (err) {
            next(err);
        }
    },
    async featured(req, res, next) {
        try {
            const products = await productService_1.productService.findFeatured();
            res.json(products);
        }
        catch (err) {
            next(err);
        }
    },
    async detail(req, res, next) {
        try {
            const product = await productService_1.productService.findBySlug(String(req.params.slug));
            if (!product)
                return res.status(404).json({ error: 'Produto não encontrado' });
            res.json(product);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=productController.js.map