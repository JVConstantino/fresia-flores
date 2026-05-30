"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
router.get('/featured', productController_1.productController.featured);
router.get('/:slug', productController_1.productController.detail);
router.get('/', productController_1.productController.list);
exports.default = router;
//# sourceMappingURL=products.js.map