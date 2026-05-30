"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderController = void 0;
const express_1 = require("express");
const adminOrderService_1 = require("@/services/adminOrderService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const status = req.query.status;
        res.json(await adminOrderService_1.adminOrderService.getAll(page, pageSize, status));
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        res.json(await adminOrderService_1.adminOrderService.getById(parseInt(req.params.id)));
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id', async (req, res, next) => {
    try {
        const order = await adminOrderService_1.adminOrderService.updateStatus(parseInt(req.params.id), req.body.status);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
});
exports.adminOrderController = router;
//# sourceMappingURL=adminOrderController.js.map