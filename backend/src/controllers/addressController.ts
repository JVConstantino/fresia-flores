import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

export const addressController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
      })
      res.json(addresses)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body
      if (!street || !number || !neighborhood || !city || !state || !zipCode) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' })
      }
      if (isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const address = await prisma.address.create({
        data: { userId, street, number, complement: complement || null, neighborhood, city, state, zipCode, isDefault: !!isDefault },
      })
      res.status(201).json(address)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const id = Number(req.params.id)
      const existing = await prisma.address.findFirst({ where: { id, userId } })
      if (!existing) return res.status(404).json({ error: 'Endereço não encontrado' })
      const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body
      if (isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const address = await prisma.address.update({
        where: { id },
        data: { street, number, complement: complement || null, neighborhood, city, state, zipCode, isDefault: !!isDefault },
      })
      res.json(address)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const id = Number(req.params.id)
      const existing = await prisma.address.findFirst({ where: { id, userId } })
      if (!existing) return res.status(404).json({ error: 'Endereço não encontrado' })
      await prisma.address.delete({ where: { id } })
      res.json({ message: 'Endereço removido' })
    } catch (err) {
      next(err)
    }
  },
}
