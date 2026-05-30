"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressController = void 0;
const client_1 = require("@/prisma/client");
exports.addressController = {
    async list(req, res, next) {
        try {
            const userId = req.user.id;
            const addresses = await client_1.prisma.address.findMany({
                where: { userId },
                orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
            });
            res.json(addresses);
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body;
            if (!street || !number || !neighborhood || !city || !state || !zipCode) {
                return res.status(400).json({ error: 'Campos obrigatórios faltando' });
            }
            if (isDefault) {
                await client_1.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
            }
            const address = await client_1.prisma.address.create({
                data: { userId, street, number, complement: complement || null, neighborhood, city, state, zipCode, isDefault: !!isDefault },
            });
            res.status(201).json(address);
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            const existing = await client_1.prisma.address.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ error: 'Endereço não encontrado' });
            const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body;
            if (isDefault) {
                await client_1.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
            }
            const address = await client_1.prisma.address.update({
                where: { id },
                data: { street, number, complement: complement || null, neighborhood, city, state, zipCode, isDefault: !!isDefault },
            });
            res.json(address);
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            const existing = await client_1.prisma.address.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ error: 'Endereço não encontrado' });
            await client_1.prisma.address.delete({ where: { id } });
            res.json({ message: 'Endereço removido' });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=addressController.js.map