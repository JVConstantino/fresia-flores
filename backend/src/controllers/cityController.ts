import { Request, Response, NextFunction } from 'express'
import { cityService } from '../services/cityService'

export const cityController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await cityService.findAll()) } catch (err) { next(err) }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, state, ibgeCode } = req.body
      res.status(201).json(await cityService.create(name, state, ibgeCode))
    } catch (err) { next(err) }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await cityService.update(Number(req.params.id), req.body))
    } catch (err) { next(err) }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await cityService.delete(Number(req.params.id))
      res.json({ message: 'ok' })
    } catch (err) { next(err) }
  },
}
