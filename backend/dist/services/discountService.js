"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discountService = void 0;
const client_1 = require("@/prisma/client");
exports.discountService = {
    async calculateDiscounts(items) {
        const now = new Date();
        const productIds = items.map(i => i.productId);
        // Buscar promoções ativas que incluem esses produtos
        const promotions = await client_1.prisma.promotion.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validTo: { gte: now },
                products: { some: { id: { in: productIds } } },
            },
            include: { products: { select: { id: true } } },
        });
        // Mapear produto → melhor promoção
        const productPromoMap = new Map();
        for (const promo of promotions) {
            const discountValue = parseFloat(promo.discountValue.toString());
            for (const p of promo.products) {
                const existing = productPromoMap.get(p.id);
                // Manter a melhor promoção (maior desconto)
                if (!existing || discountValue > existing.discountValue) {
                    productPromoMap.set(p.id, {
                        name: promo.name,
                        discountType: promo.discountType,
                        discountValue,
                    });
                }
            }
        }
        let totalPromotionDiscount = 0;
        const discountedItems = items.map(item => {
            const promo = productPromoMap.get(item.productId);
            if (!promo) {
                return {
                    ...item,
                    originalPrice: item.price,
                    discountedPrice: item.price,
                    promotionDiscount: 0,
                };
            }
            const discount = promo.discountType === 'percentage'
                ? item.price * (promo.discountValue / 100)
                : Math.min(promo.discountValue, item.price);
            const discountedPrice = parseFloat((item.price - discount).toFixed(2));
            const totalItemDiscount = parseFloat((discount * item.qty).toFixed(2));
            totalPromotionDiscount += totalItemDiscount;
            return {
                ...item,
                originalPrice: item.price,
                discountedPrice,
                promotionName: promo.name,
                promotionDiscount: totalItemDiscount,
            };
        });
        return { items: discountedItems, totalPromotionDiscount: parseFloat(totalPromotionDiscount.toFixed(2)) };
    },
};
//# sourceMappingURL=discountService.js.map