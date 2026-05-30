import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

export const wishlistController = {
  async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const wishlist = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true }
      })
      res.json(wishlist.map(w => w.productId))
    } catch (err) {
      next(err)
    }
  },

  async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const productId = parseInt(String(req.params.productId))

      const existing = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } }
      })

      if (existing) {
        return res.status(200).json({ message: 'Already in wishlist' })
      }

      await prisma.wishlist.create({
        data: { userId, productId }
      })

      res.status(201).json({ message: 'Added to wishlist' })
    } catch (err) {
      next(err)
    }
  },

  async removeFromWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const productId = parseInt(String(req.params.productId))

      await prisma.wishlist.deleteMany({
        where: { userId, productId }
      })

      res.status(200).json({ message: 'Removed from wishlist' })
    } catch (err) {
      next(err)
    }
  },

  async syncWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { localIds } = req.body as { localIds: number[] }

      if (!Array.isArray(localIds)) {
        return res.status(400).json({ error: 'localIds must be an array' })
      }

      const existing = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true }
      })
      const serverIds = existing.map(w => w.productId)

      const toAdd = localIds.filter(id => !serverIds.includes(id))
      if (toAdd.length > 0) {
        await prisma.wishlist.createMany({
          data: toAdd.map(productId => ({ userId, productId })),
          skipDuplicates: true
        })
      }

      const merged = Array.from(new Set([...serverIds, ...localIds]))
      res.status(200).json({ mergedIds: merged })
    } catch (err) {
      next(err)
    }
  }
}
