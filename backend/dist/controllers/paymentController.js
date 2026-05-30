"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const paymentService_1 = require("../services/paymentService");
exports.paymentController = {
    async processPayment(req, res, next) {
        try {
            const { orderId, cardToken, paymentMethodId, installments, cpf } = req.body;
            const result = await paymentService_1.paymentService.processPayment({
                orderId,
                cardToken,
                paymentMethodId,
                installments: installments || 1,
                customerEmail: req.user.email,
                customerPhone: req.user.phone,
                cpf
            });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
};
//# sourceMappingURL=paymentController.js.map