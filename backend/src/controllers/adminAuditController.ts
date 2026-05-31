import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

type AuditItem = {
  id: string
  action: string
  entity: string
  entityId: string
  userId: string | null
  diff: string | null
  createdAt: Date
}

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    const entity = String(req.query.entity || '').trim()

    const [users, orders, movements] = await Promise.all([
      prisma.user.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, isAdmin: true, createdAt: true },
      }),
      prisma.order.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, total: true, createdAt: true, userId: true },
      }),
      prisma.supplyMovement.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, quantity: true, supplyId: true, userId: true, reason: true, createdAt: true },
      }),
    ])

    const userItems: AuditItem[] = users.map((u) => ({
      id: `user-${u.id}-${u.createdAt.getTime()}`,
      action: 'create',
      entity: 'user',
      entityId: String(u.id),
      userId: null,
      diff: `Cadastro de ${u.name}${u.isAdmin ? ' (admin)' : ''}`,
      createdAt: u.createdAt,
    }))

    const orderItems: AuditItem[] = orders.map((o) => ({
      id: `order-${o.id}-${o.createdAt.getTime()}`,
      action: 'create',
      entity: 'order',
      entityId: String(o.id),
      userId: o.userId ? String(o.userId) : null,
      diff: `Pedido ${o.status} - R$ ${Number(o.total).toFixed(2)}`,
      createdAt: o.createdAt,
    }))

    const movementItems: AuditItem[] = movements.map((m) => ({
      id: `supply-${m.id}-${m.createdAt.getTime()}`,
      action: m.type,
      entity: 'supply',
      entityId: String(m.supplyId),
      userId: m.userId ? String(m.userId) : null,
      diff: `${m.type} ${Number(m.quantity)} un${m.reason ? ` - ${m.reason}` : ''}`,
      createdAt: m.createdAt,
    }))

    const merged = [...userItems, ...orderItems, ...movementItems]
      .filter((item) => !entity || item.entity === entity)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = merged.length
    const start = (page - 1) * limit
    const items = merged.slice(start, start + limit)

    res.json({ items, total, page, limit })
  } catch (err) {
    next(err)
  }
})

export const adminAuditController = router
