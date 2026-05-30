import { Router, Request, Response, NextFunction } from 'express'
import { adminOrderService } from '@/services/adminOrderService'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string | undefined
    res.json(await adminOrderService.getAll(page, pageSize, status))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminOrderService.getById(parseInt(req.params.id as string)))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await adminOrderService.updateStatus(
      parseInt(req.params.id as string),
      req.body.status
    )
    res.json(order)
  } catch (err) {
    next(err)
  }
})

export const adminOrderController = router
