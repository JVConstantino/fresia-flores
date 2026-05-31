# Plano 05 — Pedidos Admin (Criar Backend)

> **Prioridade:** 🔴 P0
> **Dependências:** nenhuma (cria estrutura nova)

---

## Contexto

Frontend `OrderList.tsx` e `adminOrderService.ts` chamam:
- `GET /api/v1/admin/orders?status=...&page=...`
- `GET /api/v1/admin/orders/:id`
- `PATCH /api/v1/admin/orders/:id` (atualiza `status`)

Backend só tem `POST /api/v1/orders` (criar pedido como cliente). Falta toda a parte admin.

Status válidos do pedido (confirmar no `schema.prisma`): `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`.

---

## Arquivos a Criar

### A. `backend/src/services/adminOrderService.ts`

```ts
import { prisma } from '@/prisma/client'

const VALID_STATUS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
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
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ])
    return { items, total, page, pageSize }
  },

  async getById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    })
    if (!order) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 })
    return order
  },

  async updateStatus(id: number, status: string) {
    if (!VALID_STATUS.includes(status as OrderStatus)) {
      throw Object.assign(new Error('Status inválido'), { statusCode: 400 })
    }
    return prisma.order.update({ where: { id }, data: { status } })
  },
}
```

> Ajustar `include` conforme nomes reais das relações no `schema.prisma` (ex: `OrderItem`, `User`, `Product`).

### B. `backend/src/controllers/adminOrderController.ts`

```ts
import { Router, Request, Response, NextFunction } from 'express'
import { adminOrderService } from '@/services/adminOrderService'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json(await adminOrderService.getAll(page, pageSize, req.query.status as string))
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try { res.json(await adminOrderService.getById(parseInt(req.params.id))) }
  catch (err) { next(err) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const order = await adminOrderService.updateStatus(parseInt(req.params.id), req.body.status)
    res.json(order)
  } catch (err) { next(err) }
})

export const adminOrderController = router
```

### C. `backend/src/server.ts`
```ts
import { adminOrderController } from './controllers/adminOrderController'
// ...
app.use('/api/v1/admin/orders', authMiddleware, adminMiddleware, adminOrderController)
```

---

## Verificação

1. Cliente cria pedido em `/checkout` (já funciona).
2. Login admin → `/admin/pedidos` → ver pedido na lista.
3. Filtrar por status `pending` → mostra só pendentes.
4. Mudar status para `confirmed` → reflete no banco e na lista.
5. Cliente em `/conta` vê novo status do pedido.
6. `curl`:
   ```bash
   curl -b cookies.txt http://localhost:4000/api/v1/admin/orders
   ```
   Esperado: `200` com lista paginada.
