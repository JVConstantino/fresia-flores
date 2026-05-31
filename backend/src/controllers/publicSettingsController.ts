import { Router, Request, Response, NextFunction } from 'express'
import { settingService } from '@/services/settingService'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await settingService.getPublic())
  } catch (err) {
    next(err)
  }
})

export const publicSettingsController = router
