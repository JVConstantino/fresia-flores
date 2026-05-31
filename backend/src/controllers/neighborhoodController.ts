import { Request, Response, NextFunction } from 'express'
import { neighborhoodService } from '../services/neighborhoodService'

export const neighborhoodController = {
  async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query.cityId ? Number(req.query.cityId) : undefined
      if (!cityId) return res.status(400).json({ error: 'cityId obrigatório' })
      res.json(await neighborhoodService.findByCityId(cityId))
    } catch (err) { next(err) }
  },
  async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query.cityId ? Number(req.query.cityId) : undefined
      res.json(await neighborhoodService.findAllAdmin(cityId))
    } catch (err) { next(err) }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId, name, deliveryFee } = req.body
      res.status(201).json(await neighborhoodService.create(Number(cityId), name, Number(deliveryFee)))
    } catch (err) { next(err) }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await neighborhoodService.update(Number(req.params.id), req.body))
    } catch (err) { next(err) }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await neighborhoodService.delete(Number(req.params.id))
      res.json({ message: 'ok' })
    } catch (err) { next(err) }
  },
}
