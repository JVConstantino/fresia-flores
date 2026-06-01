import { prisma } from '@/prisma/client'
import { paymentService } from './paymentService'
import { triggerWebhooks } from './webhookService'

interface CreateOrderInput {
  userId?: number
  items: { productId: number; variantId?: number | null; qty: number; price: number }[]
  neighborhoodId?: number
  deliveryMethod: string
  deliveryMessage?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  cardToken?: string
  paymentMethodId?: string
  installments?: number
  cpf?: string
  couponId?: number
  discount?: number
  paymentMethod?: string // 'card' | 'pix'
  isTestMode?: boolean
  street?: string
  number?: string
  complement?: string
  zipCode?: string
  neighborhoodName?: string
  city?: string
  state?: string
}

export const orderService = {
  async create(input: CreateOrderInput) {
    let deliveryFee = 0
    if (input.deliveryMethod !== 'retirada' && input.deliveryMethod !== 'whatsapp_quote') {
      if (!input.neighborhoodId) throw Object.assign(new Error('Bairro é obrigatório para entrega'), { statusCode: 400 })
      const neighborhood = await prisma.neighborhood.findUnique({ where: { id: input.neighborhoodId } })
      if (!neighborhood) throw Object.assign(new Error('Bairro não encontrado'), { statusCode: 404 })
      deliveryFee = Number(neighborhood.deliveryFee)
    }

    // Validar que todos os productIds existem
    const productIds = [...new Set(input.items.map(i => i.productId))]
    const existingProducts = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })
    const missingIds = productIds.filter(id => !existingProducts.find(p => p.id === id))
    if (missingIds.length > 0) {
      throw Object.assign(new Error(`Produto(s) não encontrado(s): ${missingIds.join(', ')}`), { statusCode: 400 })
    }

    const itemsTotal = input.items.reduce((acc, i) => acc + i.price * i.qty, 0)
    const discountAmount = input.discount ?? 0
    const total = Math.max(0, itemsTotal - discountAmount + deliveryFee)

    // Se tem cupom, incrementar usedCount
    if (input.couponId) {
      await prisma.coupon.update({
        where: { id: input.couponId },
        data: { usedCount: { increment: 1 } }
      })
    }

    // Validar se o userId do cookie de fato existe no banco (evita erros de FK por cookie de sessão antigo pós-seed)
    let validatedUserId: number | undefined = input.userId
    if (validatedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: validatedUserId }, select: { id: true } })
      if (!userExists) {
        validatedUserId = undefined
      }
    }

    const isWhatsAppQuote = input.deliveryMethod === 'whatsapp_quote'

    const order = await prisma.order.create({
      data: {
        userId: validatedUserId,
        status: isWhatsAppQuote ? 'pending' : (input.isTestMode ? 'paid' : 'pending'),
        paymentStatus: isWhatsAppQuote ? 'waiting_quote' : (input.isTestMode ? 'approved' : (input.cardToken ? 'processing' : 'pending')),
        paymentMethod: input.paymentMethod ?? 'card',
        paymentId: input.isTestMode ? 'TEST_MODE' : undefined,
        total: isWhatsAppQuote ? Math.max(0, itemsTotal - discountAmount) : total,
        discount: discountAmount > 0 ? discountAmount : null,
        deliveryFee: isWhatsAppQuote ? null : deliveryFee,
        couponId: input.couponId ?? null,
        deliveryMessage: input.deliveryMessage,
        deliveryMethod: input.deliveryMethod,
        neighborhoodId: input.neighborhoodId,
        street: input.street,
        number: input.number,
        complement: input.complement,
        zipCode: input.zipCode,
        neighborhoodName: input.neighborhoodName,
        city: input.city,
        state: input.state,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        items: {
          create: input.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            qty: i.qty,
            price: i.price,
          })),
        },
      },
      select: { id: true, status: true, paymentStatus: true, total: true, paymentMethod: true },
    })

    // Processar pagamento com cartão automaticamente se não for testMode
    if (input.cardToken && input.paymentMethodId && input.cpf && !input.isTestMode) {
      await paymentService.processPayment({
        orderId: order.id,
        cardToken: input.cardToken,
        paymentMethodId: input.paymentMethodId,
        installments: input.installments || 1,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        cpf: input.cpf
      })
    }

    // Disparar webhook não-bloqueante
    triggerWebhooks('order.created', {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      items: input.items,
    }).catch(() => {})

    return order
  },

  async findMyOrders(userId: number) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          }
        }
      }
    })
  },
}
