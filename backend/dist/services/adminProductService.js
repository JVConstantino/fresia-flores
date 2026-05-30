"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductService = void 0;
const client_1 = require("@/prisma/client");
const library_1 = require("@prisma/client/runtime/library");
class AdminProductService {
    async getAll(page = 1, pageSize = 10, category, search) {
        const skip = (page - 1) * pageSize;
        const where = {};
        if (category)
            where.categoryId = parseInt(category);
        if (search)
            where.name = { contains: search };
        const [data, total] = await Promise.all([
            client_1.prisma.product.findMany({
                where,
                skip,
                take: pageSize,
                include: { category: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            client_1.prisma.product.count({ where })
        ]);
        return {
            data: data.map(p => ({
                id: p.id,
                name: p.name,
                price: parseFloat(p.price.toString()),
                salePrice: p.salePrice ? parseFloat(p.salePrice.toString()) : null,
                stock: p.stock,
                categoryId: p.categoryId,
                categoryName: p.category.name,
                isActive: p.isActive,
                images: p.images,
                slug: p.slug
            })),
            pagination: { page, pageSize, total }
        };
    }
    async getById(id) {
        const product = await client_1.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                variants: true
            }
        });
        if (!product)
            throw new Error('Produto não encontrado');
        return {
            ...product,
            price: parseFloat(product.price.toString()),
            salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : null,
        };
    }
    async create(input) {
        if (!input.name)
            throw Object.assign(new Error('Nome é obrigatório'), { statusCode: 400 });
        if (!input.price || input.price <= 0)
            throw Object.assign(new Error('Preço deve ser maior que 0'), { statusCode: 400 });
        if (!input.categoryId)
            throw Object.assign(new Error('Categoria é obrigatória'), { statusCode: 400 });
        const baseSlug = (input.slug || input.name)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        let slug = baseSlug;
        let suffix = 1;
        while (await client_1.prisma.product.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${suffix++}`;
        }
        return client_1.prisma.product.create({
            data: {
                name: input.name,
                slug,
                description: input.description,
                price: new library_1.Decimal(input.price),
                salePrice: input.salePrice ? new library_1.Decimal(input.salePrice) : null,
                stock: input.stock ?? 0,
                categoryId: input.categoryId,
                isActive: input.isActive ?? true,
                images: input.images ?? null,
                variants: input.variants && input.variants.length > 0
                    ? {
                        createMany: {
                            data: input.variants.map(v => ({
                                name: v.name,
                                description: v.description ?? null,
                                price: new library_1.Decimal(Number(v.price)),
                                salePrice: v.salePrice ? new library_1.Decimal(Number(v.salePrice)) : null,
                                stock: Number(v.stock),
                                images: v.images ?? null,
                            }))
                        }
                    }
                    : undefined,
            },
            include: { variants: true }
        });
    }
    async update(id, input) {
        const updateData = {};
        if (input.name !== undefined)
            updateData.name = input.name;
        if (input.description !== undefined)
            updateData.description = input.description;
        if (input.shortDescription !== undefined)
            updateData.shortDescription = input.shortDescription;
        if (input.categoryId !== undefined)
            updateData.categoryId = Number(input.categoryId);
        if (input.price !== undefined)
            updateData.price = new library_1.Decimal(Number(input.price));
        if (input.salePrice !== undefined)
            updateData.salePrice = input.salePrice ? new library_1.Decimal(Number(input.salePrice)) : null;
        if (input.stock !== undefined)
            updateData.stock = Number(input.stock);
        if (input.isActive !== undefined)
            updateData.isActive = Boolean(input.isActive);
        if (input.isFeatured !== undefined)
            updateData.isFeatured = Boolean(input.isFeatured);
        if (input.allowCoupons !== undefined)
            updateData.allowCoupons = Boolean(input.allowCoupons);
        if (input.images !== undefined)
            updateData.images = input.images;
        if (input.slug !== undefined && input.slug)
            updateData.slug = input.slug;
        const product = await client_1.prisma.product.update({ where: { id }, data: updateData });
        // Sincronizar variantes: deletar antigas e recriar
        if (input.variants !== undefined) {
            await client_1.prisma.productVariant.deleteMany({ where: { productId: id } });
            if (input.variants.length > 0) {
                await client_1.prisma.productVariant.createMany({
                    data: input.variants.map(v => ({
                        productId: id,
                        name: v.name,
                        description: v.description ?? null,
                        price: new library_1.Decimal(Number(v.price)),
                        salePrice: v.salePrice ? new library_1.Decimal(Number(v.salePrice)) : null,
                        stock: Number(v.stock),
                        images: v.images ?? null,
                    }))
                });
            }
        }
        return client_1.prisma.product.findUnique({
            where: { id },
            include: { variants: true, category: true }
        });
    }
    async delete(id) {
        await client_1.prisma.product.delete({ where: { id } });
    }
    async batchDelete(ids) {
        await client_1.prisma.product.deleteMany({ where: { id: { in: ids } } });
    }
}
exports.adminProductService = new AdminProductService();
//# sourceMappingURL=adminProductService.js.map