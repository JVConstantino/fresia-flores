"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettingController = void 0;
const express_1 = require("express");
const settingService_1 = require("@/services/settingService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        res.json(await settingService_1.settingService.getAll());
    }
    catch (err) {
        next(err);
    }
});
router.put('/', async (req, res, next) => {
    try {
        res.json(await settingService_1.settingService.updateMany(req.body));
    }
    catch (err) {
        next(err);
    }
});
exports.adminSettingController = router;
//# sourceMappingURL=adminSettingController.js.map