import { Router, Request, Response, NextFunction } from 'express'
import { adminCategoryService } from '@/services/adminCategoryService'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminCategoryService.getAll())
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await adminCategoryService.create(req.body))
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminCategoryService.update(parseInt(req.params.id as string), req.body))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminCategoryService.delete(parseInt(req.params.id as string))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export const adminCategoryController = router
