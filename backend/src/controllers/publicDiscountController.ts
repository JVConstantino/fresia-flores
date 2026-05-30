import { Router, Request, Response, NextFunction } from 'express'
import { discountService } from '@/services/discountService'

const router = Router()

// POST /api/v1/discounts/calculate — público
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body
    if (!items || !Array.isArray(items)) throw Object.assign(new Error('Items é obrigatório'), { statusCode: 400 })
    res.json(await discountService.calculateDiscounts(items))
  } catch (err) {
    next(err)
  }
})

export const publicDiscountController = router
