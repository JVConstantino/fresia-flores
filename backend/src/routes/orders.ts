import { Router } from 'express'
import { orderController } from '../controllers/orderController'
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware'

const router = Router()
router.post('/', optionalAuthMiddleware, orderController.create)
router.get('/me', authMiddleware, orderController.myOrders)
export default router
