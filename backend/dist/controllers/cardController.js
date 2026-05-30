"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardController = void 0;
const client_1 = require("@/prisma/client");
exports.cardController = {
    async list(req, res, next) {
        try {
            const userId = req.user.id;
            const cards = await client_1.prisma.paymentCard.findMany({
                where: { userId },
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
                select: {
                    id: true,
                    brand: true,
                    lastFour: true,
                    nickname: true,
                    isDefault: true,
                    paymentMethodId: true,
                    createdAt: true
                    // TODO: Never return mpToken to client (security)
                }
            });
            res.json(cards);
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const { mpToken, brand, lastFour, nickname, isDefault } = req.body;
            // Validate required fields
            if (!mpToken || !brand || !lastFour) {
                return res.status(400).json({
                    error: 'Campos obrigatórios: mpToken, brand, lastFour'
                });
            }
            // TODO: Validate lastFour is exactly 4 digits
            if (!/^\d{4}$/.test(lastFour)) {
                return res.status(400).json({
                    error: 'lastFour deve conter exatamente 4 dígitos'
                });
            }
            // TODO: Call real MP API to get paymentMethodId from token
            // For now, detect from brand
            const paymentMethodId = brand.toLowerCase();
            // If marking as default, unmark others
            if (isDefault) {
                await client_1.prisma.paymentCard.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false }
                });
            }
            // Save card
            const card = await client_1.prisma.paymentCard.create({
                data: {
                    userId,
                    brand,
                    lastFour,
                    nickname: nickname || null,
                    isDefault: isDefault || false,
                    mpToken,
                    paymentMethodId
                },
                select: {
                    id: true,
                    brand: true,
                    lastFour: true,
                    nickname: true,
                    isDefault: true,
                    paymentMethodId: true,
                    createdAt: true
                    // TODO: Never return mpToken to client (security)
                }
            });
            res.status(201).json(card);
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            const existing = await client_1.prisma.paymentCard.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ error: 'Cartão não encontrado' });
            await client_1.prisma.paymentCard.delete({ where: { id } });
            res.json({ message: 'Cartão removido' });
        }
        catch (err) {
            next(err);
        }
    }
};
//# sourceMappingURL=cardController.js.map