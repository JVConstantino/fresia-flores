import { prisma } from '@/prisma/client'

export const categoryService = {
  async findAll() {
    return prisma.category.findMany({
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    })
  },
}
