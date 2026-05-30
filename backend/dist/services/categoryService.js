"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const client_1 = require("@/prisma/client");
exports.categoryService = {
    async findAll() {
        return client_1.prisma.category.findMany({
            include: {
                _count: { select: { products: { where: { isActive: true } } } },
            },
            orderBy: { name: 'asc' },
        });
    },
};
//# sourceMappingURL=categoryService.js.map