"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCategoryService = void 0;
const client_1 = require("@/prisma/client");
function slugify(s) {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
exports.adminCategoryService = {
    async getAll() {
        return client_1.prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { products: true } } },
        });
    },
    async create(data) {
        if (!data.name)
            throw Object.assign(new Error('Nome é obrigatório'), { statusCode: 400 });
        const slug = data.slug || slugify(data.name);
        const exists = await client_1.prisma.category.findUnique({ where: { slug } });
        if (exists)
            throw Object.assign(new Error('Slug já existe'), { statusCode: 409 });
        return client_1.prisma.category.create({ data: { name: data.name, slug, imageUrl: data.imageUrl ?? null } });
    },
    async update(id, data) {
        const category = await client_1.prisma.category.findUnique({ where: { id } });
        if (!category)
            throw Object.assign(new Error('Categoria não encontrada'), { statusCode: 404 });
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.slug)
            updateData.slug = data.slug;
        else if (data.name)
            updateData.slug = slugify(data.name);
        if (data.imageUrl !== undefined)
            updateData.imageUrl = data.imageUrl;
        return client_1.prisma.category.update({ where: { id }, data: updateData });
    },
    async delete(id) {
        const products = await client_1.prisma.product.count({ where: { categoryId: id } });
        if (products > 0)
            throw Object.assign(new Error(`Categoria possui ${products} produto(s) e não pode ser excluída`), { statusCode: 409 });
        return client_1.prisma.category.delete({ where: { id } });
    },
};
//# sourceMappingURL=adminCategoryService.js.map