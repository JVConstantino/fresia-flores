"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterController = void 0;
const express_1 = require("express");
const newsletterService_1 = require("@/services/newsletterService");
const router = (0, express_1.Router)();
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email inválido' });
        }
        if (email.length > 100) {
            return res.status(400).json({ error: 'Email muito longo' });
        }
        const result = await newsletterService_1.newsletterService.subscribe(email);
        return res.status(201).json(result);
    }
    catch (err) {
        if (err.message.includes('já inscrito')) {
            return res.status(409).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Erro ao inscrever' });
    }
});
exports.newsletterController = router;
//# sourceMappingURL=newsletterController.js.map