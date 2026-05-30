"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cityController_1 = require("../../controllers/cityController");
const router = (0, express_1.Router)();
router.get('/', cityController_1.cityController.list);
router.post('/', cityController_1.cityController.create);
router.patch('/:id', cityController_1.cityController.update);
router.delete('/:id', cityController_1.cityController.remove);
exports.default = router;
//# sourceMappingURL=cities.js.map