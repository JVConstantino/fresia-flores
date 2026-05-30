"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const client_1 = require("@/prisma/client");
exports.productService = {
    async findAll(categoryIds, sort = 'newest', limit, excludeSlug, priceMin, priceMax, isFeatured, hasPromotion, search) {
        const orderBy = sort === 'price_asc' ? { price: 'asc' }
            : sort === 'price_desc' ? { price: 'desc' }
                : { createdAt: 'desc' };
        const where = {
            isActive: true,
            ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
            ...(excludeSlug ? { NOT: { slug: excludeSlug } } : {}),
            ...(priceMin !== undefined || priceMax !== undefined ? {
                price: {
                    ...(priceMin !== undefined ? { gte: priceMin } : {}),
                    ...(priceMax !== undefined ? { lte: priceMax } : {}),
                }
            } : {}),
            ...(isFeatured ? { isFeatured: true } : {}),
            ...(hasPromotion ? { salePrice: { not: null } } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                ]
            } : {}),
        };
        return client_1.prisma.product.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                variants: { select: { id: true, name: true, description: true, price: true, salePrice: true, stock: true, images: true } },
            },
            orderBy,
            ...(limit ? { take: limit } : {}),
        });
    },
    async findFeatured() {
        return client_1.prisma.product.findMany({
            where: { isActive: true },
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
    },
    async findBySlug(slug) {
        return client_1.prisma.product.findFirst({
            where: { slug, isActive: true },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                variants: { select: { id: true, name: true, description: true, price: true, salePrice: true, stock: true, images: true } },
            },
        });
    },
};
//# sourceMappingURL=productService.js.map