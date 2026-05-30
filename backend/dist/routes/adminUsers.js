"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("@/middlewares/authMiddleware");
const adminMiddleware_1 = require("@/middlewares/adminMiddleware");
const adminUserController_1 = require("@/controllers/adminUserController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.use(adminMiddleware_1.adminMiddleware);
router.get('/', adminUserController_1.adminUserController.list);
router.post('/', adminUserController_1.adminUserController.create);
router.get('/:id', adminUserController_1.adminUserController.getById);
router.patch('/:id', adminUserController_1.adminUserController.update);
router.post('/:id/suspend', adminUserController_1.adminUserController.suspend);
router.post('/:id/reset-password', adminUserController_1.adminUserController.resetPassword);
router.post('/:id/temp-password', adminUserController_1.adminUserController.setTempPassword);
exports.default = router;
//# sourceMappingURL=adminUsers.js.map