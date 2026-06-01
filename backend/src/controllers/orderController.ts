import { Request, Response, NextFunction } from 'express'
import { orderService } from '../services/orderService'

export const orderController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id
      const { items, neighborhoodId, deliveryMethod, deliveryMessage, customerName, customerEmail, customerPhone, cardToken, paymentMethodId, installments, cpf, couponId, discount, paymentMethod, isTestMode, street, number, complement, zipCode, neighborhoodName, city, state } = req.body
      const parsedItems = (items as any[]).map((i: any) => ({
        productId: Number(i.productId),
        variantId: i.variantId != null ? Number(i.variantId) : null,
        qty: Number(i.qty),
        price: Number(i.price),
      }))

      const order = await orderService.create({
        userId,
        items: parsedItems,
        neighborhoodId: neighborhoodId ? Number(neighborhoodId) : undefined,
        deliveryMethod,
        deliveryMessage,
        customerName,
        customerEmail,
        customerPhone,
        cardToken,
        paymentMethodId,
        installments,
        cpf,
        couponId,
        discount,
        paymentMethod,
        isTestMode,
        street,
        number,
        complement,
        zipCode,
        neighborhoodName,
        city,
        state
      })
      res.status(201).json(order)
    } catch (err) { next(err) }
  },

  async myOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const orders = await orderService.findMyOrders(userId)
      res.json(orders)
    } catch (err) { next(err) }
  },
}
