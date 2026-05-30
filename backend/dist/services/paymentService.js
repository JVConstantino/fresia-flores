"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const client_1 = require("@/prisma/client");
const mercadopago_1 = require("../lib/mercadopago");
const webhookService_1 = require("./webhookService");
exports.paymentService = {
    async processPayment(input) {
        try {
            const payment = (0, mercadopago_1.getPaymentClient)();
            const order = await client_1.prisma.order.findUnique({
                where: { id: input.orderId },
                include: { items: true }
            });
            if (!order)
                throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });
            const result = await payment.create({
                body: {
                    transaction_amount: parseFloat(String(order.total)),
                    description: `Pedido Frésia #${order.id}`,
                    payment_method_id: input.paymentMethodId,
                    installments: input.installments,
                    token: input.cardToken,
                    payer: {
                        email: input.customerEmail,
                        phone: input.customerPhone ? {
                            area_code: input.customerPhone.substring(0, 2),
                            number: input.customerPhone.substring(2)
                        } : undefined,
                        identification: {
                            type: 'CPF',
                            number: input.cpf.replace(/\D/g, '')
                        }
                    }
                }
            });
            const paymentStatus = result.status === 'approved' ? 'approved' : result.status === 'pending' ? 'pending' : 'rejected';
            await client_1.prisma.order.update({
                where: { id: input.orderId },
                data: {
                    paymentId: String(result.id),
                    paymentStatus,
                    paymentMethod: 'card',
                    status: paymentStatus === 'approved' ? 'confirmed' : 'pending'
                }
            });
            if (paymentStatus === 'approved') {
                (0, webhookService_1.triggerWebhooks)('order.paid', {
                    id: input.orderId,
                    paymentId: String(result.id),
                    paymentMethod: 'card',
                    total: parseFloat(String(order.total)),
                    customerEmail: input.customerEmail,
                }).catch(() => { });
            }
            return { success: paymentStatus === 'approved', paymentId: result.id, status: paymentStatus };
        }
        catch (err) {
            await client_1.prisma.order.update({
                where: { id: input.orderId },
                data: { paymentStatus: 'rejected' }
            });
            throw err;
        }
    },
    async createPixPayment(input) {
        try {
            const payment = (0, mercadopago_1.getPaymentClient)();
            const order = await client_1.prisma.order.findUnique({ where: { id: input.orderId } });
            if (!order)
                throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });
            const result = await payment.create({
                body: {
                    transaction_amount: parseFloat(String(order.total)),
                    description: `Pedido Frésia #${order.id} — PIX`,
                    payment_method_id: 'pix',
                    payer: {
                        email: input.customerEmail,
                        identification: {
                            type: 'CPF',
                            number: input.cpf.replace(/\D/g, '')
                        }
                    }
                }
            });
            await client_1.prisma.order.update({
                where: { id: input.orderId },
                data: {
                    paymentId: String(result.id),
                    paymentStatus: 'pending',
                    paymentMethod: 'pix',
                }
            });
            // Extrair QR code e copia-e-cola do resultado
            const pixData = result.point_of_interaction?.transaction_data;
            return {
                paymentId: result.id,
                status: result.status,
                qrCode: pixData?.qr_code ?? '',
                qrCodeBase64: pixData?.qr_code_base64 ?? '',
                ticketUrl: pixData?.ticket_url ?? '',
                expiresAt: result.date_of_expiration ?? null,
            };
        }
        catch (err) {
            await client_1.prisma.order.update({
                where: { id: input.orderId },
                data: { paymentStatus: 'rejected' }
            });
            throw err;
        }
    },
};
//# sourceMappingURL=paymentService.js.map