import { Router } from 'express'
import { cityController } from '../../controllers/cityController'

const router = Router()
router.get('/', cityController.list)
router.post('/', cityController.create)
router.patch('/:id', cityController.update)
router.delete('/:id', cityController.remove)
export default router
