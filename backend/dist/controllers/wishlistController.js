"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistController = void 0;
const client_1 = require("@/prisma/client");
exports.wishlistController = {
    async getWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const wishlist = await client_1.prisma.wishlist.findMany({
                where: { userId },
                select: { productId: true }
            });
            res.json(wishlist.map(w => w.productId));
        }
        catch (err) {
            next(err);
        }
    },
    async addToWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const productId = parseInt(String(req.params.productId));
            const existing = await client_1.prisma.wishlist.findUnique({
                where: { userId_productId: { userId, productId } }
            });
            if (existing) {
                return res.status(200).json({ message: 'Already in wishlist' });
            }
            await client_1.prisma.wishlist.create({
                data: { userId, productId }
            });
            res.status(201).json({ message: 'Added to wishlist' });
        }
        catch (err) {
            next(err);
        }
    },
    async removeFromWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const productId = parseInt(String(req.params.productId));
            await client_1.prisma.wishlist.deleteMany({
                where: { userId, productId }
            });
            res.status(200).json({ message: 'Removed from wishlist' });
        }
        catch (err) {
            next(err);
        }
    },
    async syncWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const { localIds } = req.body;
            if (!Array.isArray(localIds)) {
                return res.status(400).json({ error: 'localIds must be an array' });
            }
            const existing = await client_1.prisma.wishlist.findMany({
                where: { userId },
                select: { productId: true }
            });
            const serverIds = existing.map(w => w.productId);
            const toAdd = localIds.filter(id => !serverIds.includes(id));
            if (toAdd.length > 0) {
                await client_1.prisma.wishlist.createMany({
                    data: toAdd.map(productId => ({ userId, productId })),
                    skipDuplicates: true
                });
            }
            const merged = Array.from(new Set([...serverIds, ...localIds]));
            res.status(200).json({ mergedIds: merged });
        }
        catch (err) {
            next(err);
        }
    }
};
//# sourceMappingURL=wishlistController.js.map