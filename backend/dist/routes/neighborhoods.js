"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const neighborhoodController_1 = require("../controllers/neighborhoodController");
const router = (0, express_1.Router)();
router.get('/', neighborhoodController_1.neighborhoodController.listPublic);
exports.default = router;
//# sourceMappingURL=neighborhoods.js.map