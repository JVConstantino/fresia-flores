import { Router, Request, Response, NextFunction } from 'express'
import { adminPromotionService } from '@/services/adminPromotionService'

const router = Router()

// Public endpoint — precisa ficar ANTES das rotas admin protegidas
// Nota: como o server.ts aplica authMiddleware+adminMiddleware no mount,
// este endpoint /active também ficará protegido. Se precisar ser público,
// mover para um router separado registrado sem middleware.
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const promotions = await adminPromotionService.getActive()
    return res.json(promotions)
  } catch (err) {
    next(err)
  }
})

// Admin endpoints
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined

    const result = await adminPromotionService.getAll(page, pageSize, status, search)
    return res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promotion = await adminPromotionService.getById(parseInt(req.params.id as string))
    return res.json(promotion)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promotion = await adminPromotionService.create(req.body)
    return res.status(201).json(promotion)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promotion = await adminPromotionService.update(parseInt(req.params.id as string), req.body)
    return res.json(promotion)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminPromotionService.delete(parseInt(req.params.id as string))
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export const adminPromotionController = router
