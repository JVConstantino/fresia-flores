"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const newsletterService_1 = require("../../services/newsletterService");
const client_1 = require("../../prisma/client");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const result = await newsletterService_1.newsletterService.getSubscriptions(1, 1000);
        return res.json(result.data);
    }
    catch {
        return res.status(500).json({ error: 'Erro ao listar inscrições' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await client_1.prisma.newsletterSubscription.delete({ where: { id } });
        return res.json({ success: true });
    }
    catch {
        return res.status(500).json({ error: 'Erro ao remover inscrição' });
    }
});
exports.default = router;
//# sourceMappingURL=newsletter.js.map