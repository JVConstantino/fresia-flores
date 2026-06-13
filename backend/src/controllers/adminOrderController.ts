import { Router, Request, Response, NextFunction } from 'express'
import { adminOrderService } from '@/services/adminOrderService'
import { emailService } from '@/services/emailService'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string | undefined
    res.json(await adminOrderService.getAll(page, pageSize, status))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminOrderService.getById(parseInt(req.params.id as string)))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body
    const order = await adminOrderService.updateStatus(parseInt(req.params.id as string), status)
    res.json(order)

    if (order.customerEmail && order.customerName) {
      emailService.sendOrderStatus(order.customerEmail, order.customerName, order.id, status).catch(() => {})
      if (status === 'entregue') {
        emailService.sendOrderDelivered(order.customerEmail, order.customerName, order.id).catch(() => {})
        emailService.sendReviewRequest(order.customerEmail, order.customerName, order.id).catch(() => {})
      }
    }
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/delivery-fee', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveryFee = parseFloat(req.body.deliveryFee)
    if (isNaN(deliveryFee) || deliveryFee < 0) {
      return res.status(400).json({ error: 'Valor de frete inválido' })
    }
    const order = await adminOrderService.setDeliveryFee(
      parseInt(req.params.id as string),
      deliveryFee
    )
    res.json(order)
  } catch (err) {
    next(err)
  }
})

export const adminOrderController = router
