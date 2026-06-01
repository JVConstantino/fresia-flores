import { prisma } from '@/prisma/client'

interface PromotionInput {
  name: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  productIds: number[]
}

interface PromotionDTO {
  id: number
  name: string
  description?: string
  discountType: string
  discountValue: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  status: 'active' | 'expired' | 'inactive'
  productCount: number
  createdAt: Date
}

class AdminPromotionService {
  private getStatus(promotion: any): 'active' | 'expired' | 'inactive' {
    if (!promotion.isActive) return 'inactive'

    const now = new Date()
    const validFrom = new Date(promotion.validFrom)
    validFrom.setHours(0, 0, 0, 0)
    const validTo = new Date(promotion.validTo)
    validTo.setHours(23, 59, 59, 999)
    if (now < validFrom || now > validTo) {
      return 'expired'
    }

    return 'active'
  }

  async getAll(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    search?: string
  ) {
    const skip = (page - 1) * pageSize
    const where: any = {}

    if (search) {
      where.name = { contains: search }
    }

    const [data, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip,
        take: pageSize,
        include: { products: { select: { id: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.promotion.count({ where })
    ])

    const promotions = data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      discountType: p.discountType,
      discountValue: parseFloat(p.discountValue.toString()),
      validFrom: p.validFrom,
      validTo: p.validTo,
      isActive: p.isActive,
      status: this.getStatus(p),
      productCount: p.products.length,
      createdAt: p.createdAt
    }))

    if (status && status !== 'all') {
      const filtered = promotions.filter(p => p.status === status)
      return {
        data: filtered,
        pagination: {
          page,
          pageSize,
          total: filtered.length
        }
      }
    }

    return {
      data: promotions,
      pagination: { page, pageSize, total }
    }
  }

  async getById(id: number) {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: { products: true }
    })

    if (!promotion) {
      throw new Error('Promoção não encontrada')
    }

    return {
      ...promotion,
      discountValue: parseFloat(promotion.discountValue.toString()),
      productIds: promotion.products.map(p => p.id)
    }
  }

  async create(input: PromotionInput) {
    // Validation
    if (input.validTo <= input.validFrom) {
      throw new Error('Data fim deve ser após data início')
    }

    if (input.discountValue <= 0) {
      throw new Error('Desconto deve ser maior que 0')
    }

    if (input.productIds.length === 0) {
      throw new Error('Mínimo 1 produto necessário')
    }

    const promotion = await prisma.promotion.create({
      data: {
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: Number(input.discountValue),
        validFrom: input.validFrom,
        validTo: input.validTo,
        isActive: input.isActive,
        products: {
          connect: input.productIds.map(id => ({ id }))
        }
      },
      include: { products: true }
    })

    return {
      ...promotion,
      discountValue: parseFloat(promotion.discountValue.toString()),
      productIds: promotion.products.map(p => p.id)
    }
  }

  async update(id: number, input: Partial<PromotionInput>) {
    if (input.validFrom && input.validTo && input.validTo <= input.validFrom) {
      throw new Error('Data fim deve ser após data início')
    }

    const updateData: any = {
      name: input.name,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue
        ? Number(input.discountValue)
        : undefined,
      validFrom: input.validFrom,
      validTo: input.validTo,
      isActive: input.isActive
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    )

    if (input.productIds && input.productIds.length > 0) {
      const promotion = await prisma.promotion.update({
        where: { id },
        data: {
          ...updateData,
          products: {
            set: input.productIds.map(pid => ({ id: pid }))
          }
        },
        include: { products: true }
      })
      return {
        ...promotion,
        discountValue: parseFloat(promotion.discountValue.toString()),
        productIds: promotion.products.map(p => p.id)
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData,
      include: { products: true }
    })

    return {
      ...promotion,
      discountValue: parseFloat(promotion.discountValue.toString()),
      productIds: promotion.products.map(p => p.id)
    }
  }

  async delete(id: number) {
    await prisma.promotion.delete({ where: { id } })
  }

  async getActive() {
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
      include: { products: true }
    })

    const now = new Date()
    return promotions
      .filter(p => {
        const validFrom = new Date(p.validFrom)
        validFrom.setHours(0, 0, 0, 0)
        const validTo = new Date(p.validTo)
        validTo.setHours(23, 59, 59, 999)
        return validFrom <= now && now <= validTo
      })
      .map(p => ({
        id: p.id,
        name: p.name,
        discountType: p.discountType,
        discountValue: parseFloat(p.discountValue.toString()),
        products: p.products
      }))
  }
}

export const adminPromotionService = new AdminPromotionService()
