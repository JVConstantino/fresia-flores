"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neighborhoodService = void 0;
const client_1 = require("@/prisma/client");
exports.neighborhoodService = {
    async findByCityId(cityId) {
        return client_1.prisma.neighborhood.findMany({
            where: { cityId, isActive: true },
            orderBy: { name: 'asc' },
        });
    },
    async findAllAdmin(cityId) {
        return client_1.prisma.neighborhood.findMany({
            where: cityId ? { cityId } : undefined,
            include: { city: { select: { id: true, name: true, state: true } } },
            orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
        });
    },
    async create(cityId, name, deliveryFee) {
        return client_1.prisma.neighborhood.create({ data: { cityId, name, deliveryFee, isActive: true } });
    },
    async update(id, data) {
        return client_1.prisma.neighborhood.update({ where: { id }, data });
    },
    async delete(id) {
        return client_1.prisma.neighborhood.delete({ where: { id } });
    },
};
//# sourceMappingURL=neighborhoodService.js.map