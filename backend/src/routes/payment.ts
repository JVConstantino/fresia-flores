import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'
import { paymentService } from '@/services/paymentService'
import { authMiddleware } from '@/middlewares/authMiddleware'

const router = Router()

// Cartão de crédito
router.post('/process', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.processPayment(req.body)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// PIX — cria pagamento PIX via Mercado Pago
router.post('/pix', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, customerEmail, cpf } = req.body
    const result = await paymentService.createPixPayment({ orderId, customerEmail, cpf })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// Webhook — recebe notificações do Mercado Pago (IPN)
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, data } = req.body

    if (type === 'payment') {
      const paymentId = data?.id ? String(data.id) : null
      if (paymentId) {
        // Buscar pedido pelo paymentId
        const order = await prisma.order.findFirst({ where: { paymentId } })
        if (order) {
          // Em produção, consultar status real do MP aqui
          // Por ora, aceitar a notificação
          console.log(`[Webhook] Notificação de pagamento ${paymentId} para pedido ${order.id}`)
        }
      }
    }

    res.status(200).send('OK')
  } catch (err) {
    next(err)
  }
})

// Consultar status de pagamento PIX
router.get('/status/:orderId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.id as string || req.params.orderId as string)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true, paymentMethod: true, paymentId: true }
    })
    if (!order) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 })
    res.json(order)
  } catch (err) {
    next(err)
  }
})

export default router
