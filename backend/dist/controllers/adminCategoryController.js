"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCategoryController = void 0;
const express_1 = require("express");
const adminCategoryService_1 = require("@/services/adminCategoryService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        res.json(await adminCategoryService_1.adminCategoryService.getAll());
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        res.status(201).json(await adminCategoryService_1.adminCategoryService.create(req.body));
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        res.json(await adminCategoryService_1.adminCategoryService.update(parseInt(req.params.id), req.body));
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await adminCategoryService_1.adminCategoryService.delete(parseInt(req.params.id));
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.adminCategoryController = router;
//# sourceMappingURL=adminCategoryController.js.map