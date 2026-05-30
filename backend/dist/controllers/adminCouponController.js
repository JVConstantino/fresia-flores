"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCouponController = void 0;
const express_1 = require("express");
const adminCouponService_1 = require("@/services/adminCouponService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const status = req.query.status;
        const search = req.query.search;
        res.json(await adminCouponService_1.adminCouponService.getAll(page, pageSize, status, search));
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        res.json(await adminCouponService_1.adminCouponService.getById(parseInt(req.params.id)));
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        res.status(201).json(await adminCouponService_1.adminCouponService.create(req.body));
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        res.json(await adminCouponService_1.adminCouponService.update(parseInt(req.params.id), req.body));
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await adminCouponService_1.adminCouponService.delete(parseInt(req.params.id));
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
// Endpoint público para validar cupom no checkout
router.post('/validate', async (req, res, next) => {
    try {
        const { code, orderTotal } = req.body;
        res.json(await adminCouponService_1.adminCouponService.validate(code, orderTotal));
    }
    catch (err) {
        next(err);
    }
});
exports.adminCouponController = router;
//# sourceMappingURL=adminCouponController.js.map