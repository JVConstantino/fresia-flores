import { Router } from 'express'
import { neighborhoodController } from '../../controllers/neighborhoodController'

const router = Router()
router.get('/', neighborhoodController.listAdmin)
router.post('/', neighborhoodController.create)
router.patch('/:id', neighborhoodController.update)
router.delete('/:id', neighborhoodController.remove)
export default router
