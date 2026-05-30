"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
const client_1 = require("@/prisma/client");
const paymentService_1 = require("./paymentService");
const webhookService_1 = require("./webhookService");
exports.orderService = {
    async create(input) {
        let deliveryFee = 0;
        if (input.deliveryMethod !== 'retirada') {
            if (!input.neighborhoodId)
                throw Object.assign(new Error('Bairro é obrigatório para entrega'), { statusCode: 400 });
            const neighborhood = await client_1.prisma.neighborhood.findUnique({ where: { id: input.neighborhoodId } });
            if (!neighborhood)
                throw Object.assign(new Error('Bairro não encontrado'), { statusCode: 404 });
            deliveryFee = Number(neighborhood.deliveryFee);
        }
        // Validar que todos os productIds existem
        const productIds = [...new Set(input.items.map(i => i.productId))];
        const existingProducts = await client_1.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
        const missingIds = productIds.filter(id => !existingProducts.find(p => p.id === id));
        if (missingIds.length > 0) {
            throw Object.assign(new Error(`Produto(s) não encontrado(s): ${missingIds.join(', ')}`), { statusCode: 400 });
        }
        const itemsTotal = input.items.reduce((acc, i) => acc + i.price * i.qty, 0);
        const discountAmount = input.discount ?? 0;
        const total = Math.max(0, itemsTotal - discountAmount + deliveryFee);
        // Se tem cupom, incrementar usedCount
        if (input.couponId) {
            await client_1.prisma.coupon.update({
                where: { id: input.couponId },
                data: { usedCount: { increment: 1 } }
            });
        }
        const order = await client_1.prisma.order.create({
            data: {
                userId: input.userId,
                status: input.isTestMode ? 'paid' : 'pending',
                paymentStatus: input.isTestMode ? 'approved' : (input.cardToken ? 'processing' : 'pending'),
                paymentMethod: input.paymentMethod ?? 'card',
                paymentId: input.isTestMode ? 'TEST_MODE' : undefined,
                total,
                discount: discountAmount > 0 ? discountAmount : null,
                couponId: input.couponId ?? null,
                deliveryMessage: input.deliveryMessage,
                deliveryMethod: input.deliveryMethod,
                neighborhoodId: input.neighborhoodId,
                customerName: input.customerName,
                customerEmail: input.customerEmail,
                customerPhone: input.customerPhone,
                items: {
                    create: input.items.map(i => ({
                        productId: i.productId,
                        variantId: i.variantId ?? null,
                        qty: i.qty,
                        price: i.price,
                    })),
                },
            },
            select: { id: true, status: true, paymentStatus: true, total: true, paymentMethod: true },
        });
        // Processar pagamento com cartão automaticamente se não for testMode
        if (input.cardToken && input.paymentMethodId && input.cpf && !input.isTestMode) {
            await paymentService_1.paymentService.processPayment({
                orderId: order.id,
                cardToken: input.cardToken,
                paymentMethodId: input.paymentMethodId,
                installments: input.installments || 1,
                customerEmail: input.customerEmail,
                customerPhone: input.customerPhone,
                cpf: input.cpf
            });
        }
        // Disparar webhook não-bloqueante
        (0, webhookService_1.triggerWebhooks)('order.created', {
            id: order.id,
            status: order.status,
            total: Number(order.total),
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            items: input.items,
        }).catch(() => { });
        return order;
    },
    async findMyOrders(userId) {
        return client_1.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: { select: { name: true } },
                        variant: { select: { name: true } },
                    }
                }
            }
        });
    },
};
//# sourceMappingURL=orderService.js.map