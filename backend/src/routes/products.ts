import { Router } from 'express'
import { productController } from '../controllers/productController'

const router = Router()
router.get('/featured', productController.featured)
router.get('/:slug', productController.detail)
router.get('/', productController.list)
export default router
