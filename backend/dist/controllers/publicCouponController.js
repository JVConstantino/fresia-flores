"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicCouponController = void 0;
const express_1 = require("express");
const adminCouponService_1 = require("@/services/adminCouponService");
const router = (0, express_1.Router)();
// POST /api/v1/coupons/validate — público, sem auth
router.post('/validate', async (req, res, next) => {
    try {
        const { code, orderTotal } = req.body;
        if (!code)
            throw Object.assign(new Error('Código é obrigatório'), { statusCode: 400 });
        if (!orderTotal || orderTotal <= 0)
            throw Object.assign(new Error('Total do pedido inválido'), { statusCode: 400 });
        res.json(await adminCouponService_1.adminCouponService.validate(code, orderTotal));
    }
    catch (err) {
        next(err);
    }
});
exports.publicCouponController = router;
//# sourceMappingURL=publicCouponController.js.map