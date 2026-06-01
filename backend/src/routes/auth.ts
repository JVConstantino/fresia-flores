import { Router } from 'express'
import { authController } from '../controllers/authController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', authMiddleware, authController.me)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
export default router
