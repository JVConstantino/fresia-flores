import { Router, Request, Response, NextFunction } from 'express'
import { adminCouponService } from '@/services/adminCouponService'

const router = Router()

// POST /api/v1/coupons/validate — público, sem auth
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderTotal } = req.body
    if (!code) throw Object.assign(new Error('Código é obrigatório'), { statusCode: 400 })
    if (!orderTotal || orderTotal <= 0) throw Object.assign(new Error('Total do pedido inválido'), { statusCode: 400 })
    res.json(await adminCouponService.validate(code, orderTotal))
  } catch (err) {
    next(err)
  }
})

export const publicCouponController = router
