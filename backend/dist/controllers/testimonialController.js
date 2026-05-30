"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialController = void 0;
const express_1 = require("express");
const testimonialService_1 = require("@/services/testimonialService");
const adminMiddleware_1 = require("@/middlewares/adminMiddleware");
const router = (0, express_1.Router)();
// Public endpoint
router.get('/', async (req, res) => {
    try {
        const testimonials = await testimonialService_1.testimonialService.getActive();
        return res.json(testimonials);
    }
    catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar testimonials' });
    }
});
// Admin endpoints
router.get('/admin', adminMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const result = await testimonialService_1.testimonialService.getAll(page, pageSize);
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar testimonials' });
    }
});
router.post('/admin', adminMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const { clientName, rating, text } = req.body;
        if (!clientName || !text || !rating) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }
        const testimonial = await testimonialService_1.testimonialService.create({
            clientName,
            rating: parseInt(rating),
            text
        });
        return res.status(201).json(testimonial);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
router.put('/admin/:id', adminMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const testimonial = await testimonialService_1.testimonialService.update(id, req.body);
        return res.json(testimonial);
    }
    catch (err) {
        return res.status(404).json({ error: 'Testimonial não encontrado' });
    }
});
router.delete('/admin/:id', adminMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await testimonialService_1.testimonialService.delete(id);
        return res.status(204).send();
    }
    catch (err) {
        return res.status(404).json({ error: 'Testimonial não encontrado' });
    }
});
exports.testimonialController = router;
//# sourceMappingURL=testimonialController.js.map