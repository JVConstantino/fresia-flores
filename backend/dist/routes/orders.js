"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.optionalAuthMiddleware, orderController_1.orderController.create);
router.get('/me', authMiddleware_1.authMiddleware, orderController_1.orderController.myOrders);
exports.default = router;
//# sourceMappingURL=orders.js.map