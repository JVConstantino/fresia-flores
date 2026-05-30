"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicPostController = void 0;
const express_1 = require("express");
const client_1 = require("@/prisma/client");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const limit = Math.min(50, parseInt(req.query.limit || '20'));
        const posts = await client_1.prisma.post.findMany({
            where: { isPublished: true },
            orderBy: { publishedAt: 'desc' },
            take: limit,
            select: {
                id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true,
            },
        });
        res.json(posts);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:slug', async (req, res, next) => {
    try {
        const post = await client_1.prisma.post.findUnique({
            where: { slug: String(req.params.slug) },
            select: {
                id: true, title: true, slug: true, excerpt: true, body: true,
                coverUrl: true, publishedAt: true, isPublished: true,
            },
        });
        if (!post || !post.isPublished)
            return res.status(404).json({ error: 'Post não encontrado' });
        res.json(post);
    }
    catch (err) {
        next(err);
    }
});
exports.publicPostController = router;
//# sourceMappingURL=publicPostController.js.map