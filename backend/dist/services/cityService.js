"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityService = void 0;
const client_1 = require("@/prisma/client");
exports.cityService = {
    async findAll() {
        return client_1.prisma.city.findMany({
            include: { _count: { select: { neighborhoods: { where: { isActive: true } } } } },
            orderBy: { name: 'asc' },
        });
    },
    async create(name, state, ibgeCode) {
        return client_1.prisma.city.create({ data: { name, state, ibgeCode } });
    },
    async update(id, data) {
        return client_1.prisma.city.update({ where: { id }, data });
    },
    async delete(id) {
        return client_1.prisma.city.delete({ where: { id } });
    },
};
//# sourceMappingURL=cityService.js.map