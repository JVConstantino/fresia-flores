import { prisma } from '@/prisma/client'
import { triggerWebhooks } from './webhookService'

const VALID_STATUS = ['pending', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
type OrderStatus = typeof VALID_STATUS[number]

export const adminOrderService = {
  async getAll(page = 1, pageSize = 20, status?: string) {
    const where = status && VALID_STATUS.includes(status as OrderStatus) ? { status } : {}
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          neighborhood: { select: { id: true, name: true } },
        },
      }),
      prisma.order.count({ where }),
    ])
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  },

  async getById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, images: true } },
            variant: { select: { id: true, name: true, images: true, description: true } },
          },
        },
        neighborhood: true,
      },
    })
    if (!order) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 })
    return order
  },

  async updateStatus(id: number, status: string) {
    if (!VALID_STATUS.includes(status as OrderStatus))
      throw Object.assign(new Error(`Status inválido. Use: ${VALID_STATUS.join(', ')}`), { statusCode: 400 })
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 })
    const updated = await prisma.order.update({ where: { id }, data: { status } })

    triggerWebhooks('order.updated', {
      id: updated.id,
      status: updated.status,
      previousStatus: order.status,
      total: Number(updated.total),
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
    }).catch(() => {})

    if (status === 'paid' || status === 'confirmed') {
      triggerWebhooks('order.paid', {
        id: updated.id,
        status: updated.status,
        total: Number(updated.total),
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
      }).catch(() => {})
    }

    return updated
  },

  async setDeliveryFee(id: number, deliveryFee: number) {
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 })
    if (order.paymentStatus !== 'waiting_quote') {
      throw Object.assign(new Error('Este pedido não está aguardando cotação de frete'), { statusCode: 400 })
    }
    const newTotal = Number(order.total) + deliveryFee
    const updated = await prisma.order.update({
      where: { id },
      data: {
        deliveryFee,
        total: newTotal,
        paymentStatus: 'pending',
      },
    })
    return updated
  },
}
