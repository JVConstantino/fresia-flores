"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductController = void 0;
const express_1 = require("express");
const adminProductService_1 = require("@/services/adminProductService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = await adminProductService_1.adminProductService.getAll(page, pageSize, req.query.category, req.query.search);
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const product = await adminProductService_1.adminProductService.getById(parseInt(req.params.id));
        return res.json(product);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const product = await adminProductService_1.adminProductService.create(req.body);
        return res.status(201).json(product);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const product = await adminProductService_1.adminProductService.update(parseInt(req.params.id), req.body);
        return res.json(product);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await adminProductService_1.adminProductService.delete(parseInt(req.params.id));
        return res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
router.post('/batch-delete', async (req, res, next) => {
    try {
        const { ids } = req.body;
        await adminProductService_1.adminProductService.batchDelete(ids);
        return res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.adminProductController = router;
//# sourceMappingURL=adminProductController.js.map