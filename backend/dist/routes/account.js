"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("@/middlewares/authMiddleware");
const authController_1 = require("@/controllers/authController");
const avatarController_1 = require("@/controllers/avatarController");
const wishlistController_1 = require("@/controllers/wishlistController");
const addressController_1 = require("@/controllers/addressController");
const cardController_1 = require("@/controllers/cardController");
const client_1 = require("@/prisma/client");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'public/uploads/' });
router.use(authMiddleware_1.authMiddleware);
// Perfil
router.patch('/profile', authController_1.authController.updateProfile);
// Avatar upload
router.post('/profile/avatar', upload.single('avatar'), avatarController_1.avatarController.upload);
// Senha
router.patch('/password', authController_1.authController.updatePassword);
// Endereços
router.get('/addresses', addressController_1.addressController.list);
router.post('/addresses', addressController_1.addressController.create);
router.put('/addresses/:id', addressController_1.addressController.update);
router.delete('/addresses/:id', addressController_1.addressController.remove);
// Cartões
router.get('/cards', cardController_1.cardController.list);
router.post('/cards', cardController_1.cardController.create);
router.delete('/cards/:id', cardController_1.cardController.remove);
// Pedidos do cliente
router.get('/orders', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const orders = await client_1.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                paymentStatus: true,
                total: true,
                createdAt: true,
                items: {
                    select: {
                        id: true,
                        qty: true,
                        price: true,
                        product: { select: { id: true, name: true, images: true } },
                        variant: { select: { id: true, name: true } },
                    }
                }
            },
        });
        res.json(orders);
    }
    catch (err) {
        next(err);
    }
});
router.get('/orders/:id', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        const order = await client_1.prisma.order.findFirst({
            where: { id, userId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, slug: true, images: true } },
                        variant: { select: { id: true, name: true, images: true } },
                    }
                },
                neighborhood: { select: { id: true, name: true, deliveryFee: true, city: { select: { name: true, state: true } } } },
                coupon: { select: { code: true, discountType: true, discountValue: true } },
            }
        });
        if (!order)
            return res.status(404).json({ error: 'Pedido não encontrado' });
        res.json(order);
    }
    catch (err) {
        next(err);
    }
});
router.post('/orders/:id/cancel', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        const { reason } = req.body;
        const order = await client_1.prisma.order.findFirst({ where: { id, userId } });
        if (!order)
            return res.status(404).json({ error: 'Pedido não encontrado' });
        // Cancelamento só permitido enquanto não confirmado/enviado/entregue
        const CANCELLABLE = ['pending', 'paid'];
        if (!CANCELLABLE.includes(order.status)) {
            return res.status(400).json({ error: `Não é possível cancelar pedidos com status "${order.status}"` });
        }
        const updated = await client_1.prisma.order.update({
            where: { id },
            data: {
                status: 'cancelled',
                deliveryMessage: order.deliveryMessage
                    ? `${order.deliveryMessage}\n\n[CANCELAMENTO]: ${reason || 'Solicitado pelo cliente'}`
                    : `[CANCELAMENTO]: ${reason || 'Solicitado pelo cliente'}`
            }
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// Wishlist
router.get('/wishlist', wishlistController_1.wishlistController.getWishlist);
router.post('/wishlist/:productId', wishlistController_1.wishlistController.addToWishlist);
router.delete('/wishlist/:productId', wishlistController_1.wishlistController.removeFromWishlist);
router.post('/wishlist/sync', wishlistController_1.wishlistController.syncWishlist);
exports.default = router;
//# sourceMappingURL=account.js.map