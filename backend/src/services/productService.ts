import { prisma } from '@/prisma/client'

type Sort = 'newest' | 'price_asc' | 'price_desc'

export const productService = {
  async findAll(
    categoryIds?: number[],
    sort: Sort = 'newest',
    limit?: number,
    excludeSlug?: string,
    priceMin?: number,
    priceMax?: number,
    isFeatured?: boolean,
    hasPromotion?: boolean,
    search?: string
  ) {
    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const }
      : sort === 'price_desc' ? { price: 'desc' as const }
      : { createdAt: 'desc' as const }

    const where: any = {
      isActive: true,
      ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
      ...(excludeSlug ? { NOT: { slug: excludeSlug } } : {}),
      ...(priceMin !== undefined || priceMax !== undefined ? {
        price: {
          ...(priceMin !== undefined ? { gte: priceMin } : {}),
          ...(priceMax !== undefined ? { lte: priceMax } : {}),
        }
      } : {}),
      ...(isFeatured ? { isFeatured: true } : {}),
      ...(hasPromotion ? { salePrice: { not: null } } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ]
      } : {}),
    }

    return prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { select: { id: true, name: true, description: true, price: true, salePrice: true, stock: true, images: true } },
      },
      orderBy,
      ...(limit ? { take: limit } : {}),
    })
  },

  async findFeatured() {
    return prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  },

  async findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { select: { id: true, name: true, description: true, price: true, salePrice: true, stock: true, images: true } },
      },
    })
  },
}
