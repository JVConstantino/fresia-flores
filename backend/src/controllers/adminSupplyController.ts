import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

const router = Router()

// Categorias
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await prisma.supplyCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { supplies: true } } },
    })
    res.json(cats)
  } catch (err) { next(err) }
})

router.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' })
    const cat = await prisma.supplyCategory.create({ data: { name } })
    res.status(201).json(cat)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Categoria já existe' })
    next(err)
  }
})

router.delete('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const count = await prisma.supply.count({ where: { categoryId: id } })
    if (count > 0) return res.status(409).json({ error: `Categoria possui ${count} suprimento(s)` })
    await prisma.supplyCategory.delete({ where: { id } })
    res.status(204).send()
  } catch (err) { next(err) }
})

// Supplies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || ''
    const lowStock = req.query.lowStock === 'true'
    const where: any = {}
    if (search) where.name = { contains: search }

    const supplies = await prisma.supply.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: true },
    })

    const filtered = lowStock
      ? supplies.filter(s => Number(s.currentStock) <= Number(s.minStock))
      : supplies

    res.json(filtered)
  } catch (err) { next(err) }
})

router.get('/financial-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fromStr = req.query.from as string
    const toStr = req.query.to as string
    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const to = toStr ? new Date(toStr) : new Date()

    const movements = await prisma.supplyMovement.findMany({
      where: { type: 'in', createdAt: { gte: from, lte: to } },
      include: { supply: { include: { category: true } } },
    })

    const byCategory = new Map<string, number>()
    let total = 0
    for (const m of movements) {
      const cost = Number(m.totalCost ?? 0)
      total += cost
      const catName = m.supply.category.name
      byCategory.set(catName, (byCategory.get(catName) ?? 0) + cost)
    }

    res.json({
      from, to, total,
      byCategory: Array.from(byCategory.entries()).map(([category, value]) => ({ category, value })),
    })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supply = await prisma.supply.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        movements: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })
    if (!supply) return res.status(404).json({ error: 'Suprimento não encontrado' })
    res.json(supply)
  } catch (err) { next(err) }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, categoryId, unit, costPerUnit, currentStock, minStock, supplier, notes } = req.body
    if (!name || !categoryId || !unit) return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    const supply = await prisma.supply.create({
      data: {
        name,
        categoryId: Number(categoryId),
        unit,
        costPerUnit: Number(costPerUnit ?? 0),
        currentStock: Number(currentStock ?? 0),
        minStock: Number(minStock ?? 0),
        supplier: supplier || null,
        notes: notes || null,
      },
    })
    res.status(201).json(supply)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const { name, categoryId, unit, costPerUnit, minStock, supplier, notes } = req.body
    const data: any = {}
    if (name !== undefined) data.name = name
    if (categoryId !== undefined) data.categoryId = Number(categoryId)
    if (unit !== undefined) data.unit = unit
    if (costPerUnit !== undefined) data.costPerUnit = Number(costPerUnit)
    if (minStock !== undefined) data.minStock = Number(minStock)
    if (supplier !== undefined) data.supplier = supplier
    if (notes !== undefined) data.notes = notes
    const supply = await prisma.supply.update({ where: { id }, data })
    res.json(supply)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.supply.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (err) { next(err) }
})

router.post('/:id/movements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplyId = Number(req.params.id)
    const { type, quantity, unitCost, reason, reference } = req.body
    if (!['in', 'out', 'adjustment'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido (in | out | adjustment)' })
    }
    const supply = await prisma.supply.findUnique({ where: { id: supplyId } })
    if (!supply) return res.status(404).json({ error: 'Suprimento não encontrado' })

    const qty = Number(quantity)
    const unit = unitCost != null ? Number(unitCost) : Number(supply.costPerUnit)
    const total = unit * qty

    let newStock = Number(supply.currentStock)
    if (type === 'in') newStock += qty
    else if (type === 'out') newStock -= qty
    else newStock = qty // adjustment = sets the value

    const userId = (req as any).user?.id ?? null

    const mov = await prisma.supplyMovement.create({
      data: {
        supplyId,
        type,
        quantity: qty,
        unitCost: unit,
        totalCost: total,
        reason: reason || null,
        reference: reference || null,
        userId,
      },
    })

    await prisma.supply.update({
      where: { id: supplyId },
      data: { currentStock: newStock },
    })

    res.status(201).json(mov)
  } catch (err) { next(err) }
})

export const adminSupplyController = router
