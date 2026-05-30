"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const categoryService_1 = require("../services/categoryService");
exports.categoryController = {
    async list(req, res, next) {
        try {
            const categories = await categoryService_1.categoryService.findAll();
            res.json(categories);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=categoryController.js.map