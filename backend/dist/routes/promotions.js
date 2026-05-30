"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminPromotionService_1 = require("@/services/adminPromotionService");
const router = (0, express_1.Router)();
router.get('/active', async (_req, res, next) => {
    try {
        res.json(await adminPromotionService_1.adminPromotionService.getActive());
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=promotions.js.map