"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const neighborhoodController_1 = require("../../controllers/neighborhoodController");
const router = (0, express_1.Router)();
router.get('/', neighborhoodController_1.neighborhoodController.listAdmin);
router.post('/', neighborhoodController_1.neighborhoodController.create);
router.patch('/:id', neighborhoodController_1.neighborhoodController.update);
router.delete('/:id', neighborhoodController_1.neighborhoodController.remove);
exports.default = router;
//# sourceMappingURL=neighborhoods.js.map