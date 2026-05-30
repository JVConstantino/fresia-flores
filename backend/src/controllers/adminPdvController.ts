import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

const router = Router()

// GET /admin/pdv/products?search=&limit=
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || ''
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20'))

    const where: any = { isActive: true }
    if (search) where.name = { contains: search }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, slug: true, price: true, salePrice: true, stock: true, images: true,
        category: { select: { name: true } },
        variants: { select: { id: true, name: true, price: true, salePrice: true, stock: true } },
      },
    })
    res.json(products)
  } catch (err) { next(err) }
})

// POST /admin/pdv/sale — registrar venda PDV
router.post('/sale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, customerId, customerName, customerEmail, customerPhone, paymentMethod, installments, discount } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens obrigatórios' })
    }
    if (!paymentMethod) return res.status(400).json({ error: 'Método de pagamento obrigatório' })

    // Validar produtos
    const productIds = [...new Set(items.map((i: any) => Number(i.productId)))]
    const existing = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, stock: true } })
    const missing = productIds.filter(id => !existing.find(p => p.id === id))
    if (missing.length) return res.status(400).json({ error: `Produto(s) não encontrado(s): ${missing.join(', ')}` })

    const itemsTotal = items.reduce((acc: number, i: any) => acc + Number(i.price) * Number(i.qty), 0)
    const total = Math.max(0, itemsTotal - Number(discount ?? 0))

    // Buscar nome do cliente se houver customerId
    let finalCustomerName = customerName || 'Cliente PDV'
    let finalCustomerEmail = customerEmail || 'pdv@fresia.local'
    let finalCustomerPhone = customerPhone || null
    let userId: number | undefined = undefined
    if (customerId) {
      const user = await prisma.user.findUnique({ where: { id: Number(customerId) } })
      if (user) {
        finalCustomerName = user.name
        finalCustomerEmail = user.email
        finalCustomerPhone = user.phone
        userId = user.id
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'paid',
        paymentStatus: 'approved',
        paymentMethod,
        paymentId: 'PDV',
        total,
        discount: Number(discount ?? 0) || null,
        deliveryMethod: 'retirada',
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        channel: 'pdv',
        installments: installments ? Number(installments) : null,
        items: {
          create: items.map((i: any) => ({
            productId: Number(i.productId),
            variantId: i.variantId ? Number(i.variantId) : null,
            qty: Number(i.qty),
            price: Number(i.price),
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
      },
    })

    // Decrementar estoque dos produtos
    for (const i of items) {
      await prisma.product.update({
        where: { id: Number(i.productId) },
        data: { stock: { decrement: Number(i.qty) } },
      })
    }

    res.status(201).json(order)
  } catch (err) { next(err) }
})

// GET /admin/pdv/customers?search= — buscar usuários para venda PDV
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || ''
    if (!search) return res.json([])
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      },
      take: 10,
      select: { id: true, name: true, email: true, phone: true },
    })
    res.json(users)
  } catch (err) { next(err) }
})

export const adminPdvController = router
