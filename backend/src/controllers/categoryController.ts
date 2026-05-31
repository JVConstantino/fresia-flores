import { Request, Response, NextFunction } from 'express'
import { categoryService } from '../services/categoryService'

export const categoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.findAll()
      res.json(categories)
    } catch (err) {
      next(err)
    }
  },
}
