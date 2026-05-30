import { Router, Request, Response, NextFunction } from 'express'
import { adminProductService } from '@/services/adminProductService'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = await adminProductService.getAll(page, pageSize, req.query.category as string, req.query.search as string)
    return res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await adminProductService.getById(parseInt(req.params.id as string))
    return res.json(product)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await adminProductService.create(req.body)
    return res.status(201).json(product)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await adminProductService.update(parseInt(req.params.id as string), req.body)
    return res.json(product)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminProductService.delete(parseInt(req.params.id as string))
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.post('/batch-delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body
    await adminProductService.batchDelete(ids)
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export const adminProductController = router
