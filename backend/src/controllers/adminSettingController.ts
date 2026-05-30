import { Router, Request, Response, NextFunction } from 'express'
import { settingService } from '@/services/settingService'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await settingService.getAll())
  } catch (err) {
    next(err)
  }
})

router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await settingService.updateMany(req.body))
  } catch (err) {
    next(err)
  }
})

export const adminSettingController = router
