import { Router, Request, Response } from 'express'
import { testimonialService } from '@/services/testimonialService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

// Public endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const testimonials = await testimonialService.getActive()
    return res.json(testimonials)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar testimonials' })
  }
})

// Admin endpoints
router.get('/admin', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = await testimonialService.getAll(page, pageSize)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar testimonials' })
  }
})

router.post('/admin', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientName, rating, text } = req.body

    if (!clientName || !text || !rating) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }

    const testimonial = await testimonialService.create({
      clientName,
      rating: parseInt(rating),
      text
    })

    return res.status(201).json(testimonial)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.put(
  '/admin/:id',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string)
      const testimonial = await testimonialService.update(id, req.body)
      return res.json(testimonial)
    } catch (err) {
      return res.status(404).json({ error: 'Testimonial não encontrado' })
    }
  }
)

router.delete(
  '/admin/:id',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string)
      await testimonialService.delete(id)
      return res.status(204).send()
    } catch (err) {
      return res.status(404).json({ error: 'Testimonial não encontrado' })
    }
  }
)

export const testimonialController = router
