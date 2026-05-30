import { prisma } from '@/prisma/client'

export const neighborhoodService = {
  async findByCityId(cityId: number) {
    return prisma.neighborhood.findMany({
      where: { cityId, isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  async findAllAdmin(cityId?: number) {
    return prisma.neighborhood.findMany({
      where: cityId ? { cityId } : undefined,
      include: { city: { select: { id: true, name: true, state: true } } },
      orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
    })
  },

  async create(cityId: number, name: string, deliveryFee: number) {
    return prisma.neighborhood.create({ data: { cityId, name, deliveryFee, isActive: true } })
  },

  async update(id: number, data: Partial<{ name: string; deliveryFee: number; isActive: boolean }>) {
    return prisma.neighborhood.update({ where: { id }, data })
  },

  async delete(id: number) {
    return prisma.neighborhood.delete({ where: { id } })
  },
}
