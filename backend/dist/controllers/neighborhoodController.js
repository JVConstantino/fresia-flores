"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neighborhoodController = void 0;
const neighborhoodService_1 = require("../services/neighborhoodService");
exports.neighborhoodController = {
    async listPublic(req, res, next) {
        try {
            const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
            if (!cityId)
                return res.status(400).json({ error: 'cityId obrigatório' });
            res.json(await neighborhoodService_1.neighborhoodService.findByCityId(cityId));
        }
        catch (err) {
            next(err);
        }
    },
    async listAdmin(req, res, next) {
        try {
            const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
            res.json(await neighborhoodService_1.neighborhoodService.findAllAdmin(cityId));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const { cityId, name, deliveryFee } = req.body;
            res.status(201).json(await neighborhoodService_1.neighborhoodService.create(Number(cityId), name, Number(deliveryFee)));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            res.json(await neighborhoodService_1.neighborhoodService.update(Number(req.params.id), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            await neighborhoodService_1.neighborhoodService.delete(Number(req.params.id));
            res.json({ message: 'ok' });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=neighborhoodController.js.map