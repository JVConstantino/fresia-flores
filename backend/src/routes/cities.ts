import { Router } from 'express'
import { cityController } from '../controllers/cityController'

const router = Router()
router.get('/', cityController.list)
export default router
