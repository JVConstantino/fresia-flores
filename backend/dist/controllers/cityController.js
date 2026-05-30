"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityController = void 0;
const cityService_1 = require("../services/cityService");
exports.cityController = {
    async list(req, res, next) {
        try {
            res.json(await cityService_1.cityService.findAll());
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const { name, state, ibgeCode } = req.body;
            res.status(201).json(await cityService_1.cityService.create(name, state, ibgeCode));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            res.json(await cityService_1.cityService.update(Number(req.params.id), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            await cityService_1.cityService.delete(Number(req.params.id));
            res.json({ message: 'ok' });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=cityController.js.map