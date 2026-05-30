"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@/prisma/client");
const paymentService_1 = require("@/services/paymentService");
const authMiddleware_1 = require("@/middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Cartão de crédito
router.post('/process', authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const result = await paymentService_1.paymentService.processPayment(req.body);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// PIX — cria pagamento PIX via Mercado Pago
router.post('/pix', authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { orderId, customerEmail, cpf } = req.body;
        const result = await paymentService_1.paymentService.createPixPayment({ orderId, customerEmail, cpf });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// Webhook — recebe notificações do Mercado Pago (IPN)
router.post('/webhook', async (req, res, next) => {
    try {
        const { type, data } = req.body;
        if (type === 'payment') {
            const paymentId = data?.id ? String(data.id) : null;
            if (paymentId) {
                // Buscar pedido pelo paymentId
                const order = await client_1.prisma.order.findFirst({ where: { paymentId } });
                if (order) {
                    // Em produção, consultar status real do MP aqui
                    // Por ora, aceitar a notificação
                    console.log(`[Webhook] Notificação de pagamento ${paymentId} para pedido ${order.id}`);
                }
            }
        }
        res.status(200).send('OK');
    }
    catch (err) {
        next(err);
    }
});
// Consultar status de pagamento PIX
router.get('/status/:orderId', authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id || req.params.orderId);
        const order = await client_1.prisma.order.findUnique({
            where: { id: orderId },
            select: { paymentStatus: true, paymentMethod: true, paymentId: true }
        });
        if (!order)
            throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });
        res.json(order);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=payment.js.map