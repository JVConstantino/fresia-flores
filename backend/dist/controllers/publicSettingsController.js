"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicSettingsController = void 0;
const express_1 = require("express");
const settingService_1 = require("@/services/settingService");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        res.json(await settingService_1.settingService.getPublic());
    }
    catch (err) {
        next(err);
    }
});
exports.publicSettingsController = router;
//# sourceMappingURL=publicSettingsController.js.map