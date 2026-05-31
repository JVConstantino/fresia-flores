import { Router, Request, Response, NextFunction } from 'express'
import { adminPromotionService } from '@/services/adminPromotionService'

const router = Router()

router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminPromotionService.getActive())
  } catch (err) {
    next(err)
  }
})

export default router
