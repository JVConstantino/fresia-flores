import { Router } from 'express'
import { neighborhoodController } from '../controllers/neighborhoodController'

const router = Router()
router.get('/', neighborhoodController.listPublic)
export default router
