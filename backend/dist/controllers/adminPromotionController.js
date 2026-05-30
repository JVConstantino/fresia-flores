"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPromotionController = void 0;
const express_1 = require("express");
const adminPromotionService_1 = require("@/services/adminPromotionService");
const router = (0, express_1.Router)();
// Public endpoint — precisa ficar ANTES das rotas admin protegidas
// Nota: como o server.ts aplica authMiddleware+adminMiddleware no mount,
// este endpoint /active também ficará protegido. Se precisar ser público,
// mover para um router separado registrado sem middleware.
router.get('/active', async (_req, res, next) => {
    try {
        const promotions = await adminPromotionService_1.adminPromotionService.getActive();
        return res.json(promotions);
    }
    catch (err) {
        next(err);
    }
});
// Admin endpoints
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const status = req.query.status;
        const search = req.query.search;
        const result = await adminPromotionService_1.adminPromotionService.getAll(page, pageSize, status, search);
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const promotion = await adminPromotionService_1.adminPromotionService.getById(parseInt(req.params.id));
        return res.json(promotion);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const promotion = await adminPromotionService_1.adminPromotionService.create(req.body);
        return res.status(201).json(promotion);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const promotion = await adminPromotionService_1.adminPromotionService.update(parseInt(req.params.id), req.body);
        return res.json(promotion);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await adminPromotionService_1.adminPromotionService.delete(parseInt(req.params.id));
        return res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.adminPromotionController = router;
//# sourceMappingURL=adminPromotionController.js.map