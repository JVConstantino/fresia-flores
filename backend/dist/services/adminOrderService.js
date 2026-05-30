"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderService = void 0;
const client_1 = require("@/prisma/client");
const webhookService_1 = require("./webhookService");
const VALID_STATUS = ['pending', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled'];
exports.adminOrderService = {
    async getAll(page = 1, pageSize = 20, status) {
        const where = status && VALID_STATUS.includes(status) ? { status } : {};
        const [items, total] = await Promise.all([
            client_1.prisma.order.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: {
                        include: {
                            product: { select: { id: true, name: true } },
                        },
                    },
                    neighborhood: { select: { id: true, name: true } },
                },
            }),
            client_1.prisma.order.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    },
    async getById(id) {
        const order = await client_1.prisma.order.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, price: true, images: true } },
                        variant: { select: { id: true, name: true, images: true, description: true } },
                    },
                },
                neighborhood: true,
            },
        });
        if (!order)
            throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });
        return order;
    },
    async updateStatus(id, status) {
        if (!VALID_STATUS.includes(status))
            throw Object.assign(new Error(`Status inválido. Use: ${VALID_STATUS.join(', ')}`), { statusCode: 400 });
        const order = await client_1.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });
        const updated = await client_1.prisma.order.update({ where: { id }, data: { status } });
        (0, webhookService_1.triggerWebhooks)('order.updated', {
            id: updated.id,
            status: updated.status,
            previousStatus: order.status,
            total: Number(updated.total),
            customerName: updated.customerName,
            customerEmail: updated.customerEmail,
        }).catch(() => { });
        if (status === 'paid' || status === 'confirmed') {
            (0, webhookService_1.triggerWebhooks)('order.paid', {
                id: updated.id,
                status: updated.status,
                total: Number(updated.total),
                customerName: updated.customerName,
                customerEmail: updated.customerEmail,
            }).catch(() => { });
        }
        return updated;
    },
};
//# sourceMappingURL=adminOrderService.js.map