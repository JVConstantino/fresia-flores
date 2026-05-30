"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const orderService_1 = require("../services/orderService");
exports.orderController = {
    async create(req, res, next) {
        try {
            const userId = req.user?.id;
            const { items, neighborhoodId, deliveryMethod, deliveryMessage, customerName, customerEmail, customerPhone, cardToken, paymentMethodId, installments, cpf, couponId, discount, paymentMethod, isTestMode } = req.body;
            const parsedItems = items.map((i) => ({
                productId: Number(i.productId),
                variantId: i.variantId != null ? Number(i.variantId) : null,
                qty: Number(i.qty),
                price: Number(i.price),
            }));
            const order = await orderService_1.orderService.create({
                userId,
                items: parsedItems,
                neighborhoodId: neighborhoodId ? Number(neighborhoodId) : undefined,
                deliveryMethod,
                deliveryMessage,
                customerName,
                customerEmail,
                customerPhone,
                cardToken,
                paymentMethodId,
                installments,
                cpf,
                couponId,
                discount,
                paymentMethod,
                isTestMode
            });
            res.status(201).json(order);
        }
        catch (err) {
            next(err);
        }
    },
    async myOrders(req, res, next) {
        try {
            const userId = req.user.id;
            const orders = await orderService_1.orderService.findMyOrders(userId);
            res.json(orders);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=orderController.js.map