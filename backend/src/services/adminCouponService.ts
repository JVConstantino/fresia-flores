import { prisma } from '@/prisma/client'

interface CouponInput {
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderValue?: number
  maxUses?: number
  validFrom: string | Date
  validTo: string | Date
  isActive?: boolean
}

function getStatus(coupon: { isActive: boolean; validFrom: Date; validTo: Date; maxUses: number | null; usedCount: number }): 'active' | 'expired' | 'inactive' | 'esgotado' {
  if (!coupon.isActive) return 'inactive'
  const now = new Date()
  const validFrom = new Date(coupon.validFrom)
  validFrom.setHours(0, 0, 0, 0)
  const validTo = new Date(coupon.validTo)
  validTo.setHours(23, 59, 59, 999)
  if (now < validFrom || now > validTo) return 'expired'
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return 'esgotado'
  return 'active'
}

export const adminCouponService = {
  async getAll(page = 1, pageSize = 20, status?: string, search?: string) {
    const where: any = {}
    if (search) where.code = { contains: search }

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.coupon.count({ where })
    ])

    const coupons = data.map(c => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: parseFloat(c.discountValue.toString()),
      minOrderValue: c.minOrderValue ? parseFloat(c.minOrderValue.toString()) : null,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      validFrom: c.validFrom,
      validTo: c.validTo,
      isActive: c.isActive,
      status: getStatus(c),
      createdAt: c.createdAt
    }))

    const filtered = status && status !== 'all'
      ? coupons.filter(c => c.status === status)
      : coupons

    return {
      data: filtered,
      pagination: { page, pageSize, total }
    }
  },

  async getById(id: number) {
    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) throw Object.assign(new Error('Cupom não encontrado'), { statusCode: 404 })
    return {
      ...coupon,
      discountValue: parseFloat(coupon.discountValue.toString()),
      minOrderValue: coupon.minOrderValue ? parseFloat(coupon.minOrderValue.toString()) : null
    }
  },

  async create(input: CouponInput) {
    if (!input.code) throw Object.assign(new Error('Código é obrigatório'), { statusCode: 400 })
    if (!input.discountValue || input.discountValue <= 0) throw Object.assign(new Error('Desconto deve ser maior que 0'), { statusCode: 400 })

    const code = input.code.toUpperCase().trim()
    const exists = await prisma.coupon.findUnique({ where: { code } })
    if (exists) throw Object.assign(new Error('Código já existe'), { statusCode: 409 })

    return prisma.coupon.create({
      data: {
        code,
        description: input.description,
        discountType: input.discountType,
        discountValue: Number(input.discountValue),
        minOrderValue: input.minOrderValue ? Number(input.minOrderValue) : null,
        maxUses: input.maxUses ?? null,
        validFrom: new Date(input.validFrom),
        validTo: new Date(input.validTo),
        isActive: input.isActive ?? true
      }
    })
  },

  async update(id: number, input: Partial<CouponInput>) {
    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) throw Object.assign(new Error('Cupom não encontrado'), { statusCode: 404 })

    const updateData: any = {}
    if (input.code) updateData.code = input.code.toUpperCase().trim()
    if (input.description !== undefined) updateData.description = input.description
    if (input.discountType) updateData.discountType = input.discountType
    if (input.discountValue) updateData.discountValue = Number(input.discountValue)
    if (input.minOrderValue !== undefined) updateData.minOrderValue = input.minOrderValue ? Number(input.minOrderValue) : null
    if (input.maxUses !== undefined) updateData.maxUses = input.maxUses
    if (input.validFrom) updateData.validFrom = new Date(input.validFrom)
    if (input.validTo) updateData.validTo = new Date(input.validTo)
    if (input.isActive !== undefined) updateData.isActive = input.isActive

    return prisma.coupon.update({ where: { id }, data: updateData })
  },

  async delete(id: number) {
    await prisma.coupon.delete({ where: { id } })
  },

  async validate(code: string, orderTotal: number) {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })
    if (!coupon) throw Object.assign(new Error('Cupom não encontrado'), { statusCode: 404 })
    if (!coupon.isActive) throw Object.assign(new Error('Cupom inativo'), { statusCode: 400 })

    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    validFrom.setHours(0, 0, 0, 0)
    const validTo = new Date(coupon.validTo)
    validTo.setHours(23, 59, 59, 999)
    if (now < validFrom || now > validTo) throw Object.assign(new Error('Cupom expirado'), { statusCode: 400 })
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw Object.assign(new Error('Cupom esgotado'), { statusCode: 400 })

    const minValue = coupon.minOrderValue ? parseFloat(coupon.minOrderValue.toString()) : 0
    if (orderTotal < minValue) throw Object.assign(new Error(`Pedido mínimo de R$ ${minValue.toFixed(2)}`), { statusCode: 400 })

    const discountValue = parseFloat(coupon.discountValue.toString())
    const discount = coupon.discountType === 'percentage'
      ? orderTotal * (discountValue / 100)
      : discountValue

    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue,
      discount: parseFloat(Math.min(discount, orderTotal).toFixed(2))
    }
  }
}
