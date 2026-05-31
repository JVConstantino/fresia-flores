import { Request, Response, NextFunction } from 'express'
import { paymentService } from '../services/paymentService'

export const paymentController = {
  async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, cardToken, paymentMethodId, installments, cpf } = req.body
      const result = await paymentService.processPayment({
        orderId,
        cardToken,
        paymentMethodId,
        installments: installments || 1,
        customerEmail: (req as any).user.email,
        customerPhone: (req as any).user.phone,
        cpf
      })
      res.json(result)
    } catch (err) { next(err) }
  }
}
