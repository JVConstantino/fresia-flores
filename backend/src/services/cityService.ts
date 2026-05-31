import { prisma } from '@/prisma/client'

export const cityService = {
  async findAll() {
    return prisma.city.findMany({
      include: { _count: { select: { neighborhoods: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' },
    })
  },

  async create(name: string, state: string, ibgeCode?: string) {
    return prisma.city.create({ data: { name, state, ibgeCode } })
  },

  async update(id: number, data: Partial<{ name: string; state: string; ibgeCode: string }>) {
    return prisma.city.update({ where: { id }, data })
  },

  async delete(id: number) {
    return prisma.city.delete({ where: { id } })
  },
}
