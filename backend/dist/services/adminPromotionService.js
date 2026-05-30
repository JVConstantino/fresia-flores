"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPromotionService = void 0;
const client_1 = require("@/prisma/client");
const library_1 = require("@prisma/client/runtime/library");
class AdminPromotionService {
    getStatus(promotion) {
        if (!promotion.isActive)
            return 'inactive';
        const now = new Date();
        if (now < promotion.validFrom || now > promotion.validTo) {
            return 'expired';
        }
        return 'active';
    }
    async getAll(page = 1, pageSize = 10, status, search) {
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search) {
            where.name = { contains: search };
        }
        const [data, total] = await Promise.all([
            client_1.prisma.promotion.findMany({
                where,
                skip,
                take: pageSize,
                include: { products: { select: { id: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            client_1.prisma.promotion.count({ where })
        ]);
        const promotions = data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            discountType: p.discountType,
            discountValue: parseFloat(p.discountValue.toString()),
            validFrom: p.validFrom,
            validTo: p.validTo,
            isActive: p.isActive,
            status: this.getStatus(p),
            productCount: p.products.length,
            createdAt: p.createdAt
        }));
        if (status && status !== 'all') {
            const filtered = promotions.filter(p => p.status === status);
            return {
                data: filtered,
                pagination: {
                    page,
                    pageSize,
                    total: filtered.length
                }
            };
        }
        return {
            data: promotions,
            pagination: { page, pageSize, total }
        };
    }
    async getById(id) {
        const promotion = await client_1.prisma.promotion.findUnique({
            where: { id },
            include: { products: true }
        });
        if (!promotion) {
            throw new Error('Promoção não encontrada');
        }
        return {
            ...promotion,
            discountValue: parseFloat(promotion.discountValue.toString()),
            productIds: promotion.products.map(p => p.id)
        };
    }
    async create(input) {
        // Validation
        if (input.validTo <= input.validFrom) {
            throw new Error('Data fim deve ser após data início');
        }
        if (input.discountValue <= 0) {
            throw new Error('Desconto deve ser maior que 0');
        }
        if (input.productIds.length === 0) {
            throw new Error('Mínimo 1 produto necessário');
        }
        const promotion = await client_1.prisma.promotion.create({
            data: {
                name: input.name,
                description: input.description,
                discountType: input.discountType,
                discountValue: new library_1.Decimal(input.discountValue),
                validFrom: input.validFrom,
                validTo: input.validTo,
                isActive: input.isActive,
                products: {
                    connect: input.productIds.map(id => ({ id }))
                }
            },
            include: { products: true }
        });
        return {
            ...promotion,
            discountValue: parseFloat(promotion.discountValue.toString()),
            productIds: promotion.products.map(p => p.id)
        };
    }
    async update(id, input) {
        if (input.validFrom && input.validTo && input.validTo <= input.validFrom) {
            throw new Error('Data fim deve ser após data início');
        }
        const updateData = {
            name: input.name,
            description: input.description,
            discountType: input.discountType,
            discountValue: input.discountValue
                ? new library_1.Decimal(input.discountValue)
                : undefined,
            validFrom: input.validFrom,
            validTo: input.validTo,
            isActive: input.isActive
        };
        // Remove undefined values
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        if (input.productIds && input.productIds.length > 0) {
            const promotion = await client_1.prisma.promotion.update({
                where: { id },
                data: {
                    ...updateData,
                    products: {
                        set: input.productIds.map(pid => ({ id: pid }))
                    }
                },
                include: { products: true }
            });
            return {
                ...promotion,
                discountValue: parseFloat(promotion.discountValue.toString()),
                productIds: promotion.products.map(p => p.id)
            };
        }
        const promotion = await client_1.prisma.promotion.update({
            where: { id },
            data: updateData,
            include: { products: true }
        });
        return {
            ...promotion,
            discountValue: parseFloat(promotion.discountValue.toString()),
            productIds: promotion.products.map(p => p.id)
        };
    }
    async delete(id) {
        await client_1.prisma.promotion.delete({ where: { id } });
    }
    async getActive() {
        const promotions = await client_1.prisma.promotion.findMany({
            where: { isActive: true },
            include: { products: true }
        });
        const now = new Date();
        return promotions
            .filter(p => p.validFrom <= now && now <= p.validTo)
            .map(p => ({
            id: p.id,
            name: p.name,
            discountType: p.discountType,
            discountValue: parseFloat(p.discountValue.toString()),
            products: p.products
        }));
    }
}
exports.adminPromotionService = new AdminPromotionService();
//# sourceMappingURL=adminPromotionService.js.map