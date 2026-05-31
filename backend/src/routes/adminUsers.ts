import { Router } from 'express'
import { authMiddleware } from '@/middlewares/authMiddleware'
import { adminMiddleware } from '@/middlewares/adminMiddleware'
import { adminUserController } from '@/controllers/adminUserController'

const router = Router()

router.use(authMiddleware)
router.use(adminMiddleware)

router.get('/', adminUserController.list)
router.post('/', adminUserController.create)
router.get('/:id', adminUserController.getById)
router.patch('/:id', adminUserController.update)
router.post('/:id/suspend', adminUserController.suspend)
router.post('/:id/reset-password', adminUserController.resetPassword)
router.post('/:id/temp-password', adminUserController.setTempPassword)

export default router
