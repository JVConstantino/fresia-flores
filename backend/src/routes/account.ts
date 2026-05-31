import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { authMiddleware } from '@/middlewares/authMiddleware'
import { authController } from '@/controllers/authController'
import { avatarController } from '@/controllers/avatarController'
import { wishlistController } from '@/controllers/wishlistController'
import { addressController } from '@/controllers/addressController'
import { cardController } from '@/controllers/cardController'
import { prisma } from '@/prisma/client'

const router = Router()
const upload = multer({ dest: 'public/uploads/' })

router.use(authMiddleware)

// Perfil
router.patch('/profile', authController.updateProfile)

// Avatar upload
router.post('/profile/avatar', upload.single('avatar'), avatarController.upload)

// Senha
router.patch('/password', authController.updatePassword)

// Endereços
router.get('/addresses', addressController.list)
router.post('/addresses', addressController.create)
router.put('/addresses/:id', addressController.update)
router.delete('/addresses/:id', addressController.remove)

// Cartões
router.get('/cards', cardController.list)
router.post('/cards', cardController.create)
router.delete('/cards/:id', cardController.remove)

// Pedidos do cliente
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            qty: true,
            price: true,
            product: { select: { id: true, name: true, images: true } },
            variant: { select: { id: true, name: true } },
          }
        }
      },
    })
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id
    const id = Number(req.params.id)
    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
            variant: { select: { id: true, name: true, images: true } },
          }
        },
        neighborhood: { select: { id: true, name: true, deliveryFee: true, city: { select: { name: true, state: true } } } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      }
    })
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' })
    res.json(order)
  } catch (err) {
    next(err)
  }
})

router.post('/orders/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id
    const id = Number(req.params.id)
    const { reason } = req.body
    const order = await prisma.order.findFirst({ where: { id, userId } })
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' })
    // Cancelamento só permitido enquanto não confirmado/enviado/entregue
    const CANCELLABLE = ['pending', 'paid']
    if (!CANCELLABLE.includes(order.status)) {
      return res.status(400).json({ error: `Não é possível cancelar pedidos com status "${order.status}"` })
    }
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        deliveryMessage: order.deliveryMessage
          ? `${order.deliveryMessage}\n\n[CANCELAMENTO]: ${reason || 'Solicitado pelo cliente'}`
          : `[CANCELAMENTO]: ${reason || 'Solicitado pelo cliente'}`
      }
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// Wishlist
router.get('/wishlist', wishlistController.getWishlist)
router.post('/wishlist/:productId', wishlistController.addToWishlist)
router.delete('/wishlist/:productId', wishlistController.removeFromWishlist)
router.post('/wishlist/sync', wishlistController.syncWishlist)

export default router
