"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicDiscountController = void 0;
const express_1 = require("express");
const discountService_1 = require("@/services/discountService");
const router = (0, express_1.Router)();
// POST /api/v1/discounts/calculate — público
router.post('/calculate', async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items))
            throw Object.assign(new Error('Items é obrigatório'), { statusCode: 400 });
        res.json(await discountService_1.discountService.calculateDiscounts(items));
    }
    catch (err) {
        next(err);
    }
});
exports.publicDiscountController = router;
//# sourceMappingURL=publicDiscountController.js.map