import { Router, Request, Response, NextFunction } from 'express'
import { adminCouponService } from '@/services/adminCouponService'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined
    res.json(await adminCouponService.getAll(page, pageSize, status, search))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminCouponService.getById(parseInt(req.params.id as string)))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await adminCouponService.create(req.body))
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminCouponService.update(parseInt(req.params.id as string), req.body))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminCouponService.delete(parseInt(req.params.id as string))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// Endpoint público para validar cupom no checkout
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderTotal } = req.body
    res.json(await adminCouponService.validate(code, orderTotal))
  } catch (err) {
    next(err)
  }
})

export const adminCouponController = router
