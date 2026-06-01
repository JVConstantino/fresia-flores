import { Router, Request, Response } from 'express'
import { testimonialService } from '@/services/testimonialService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'
import { authMiddleware } from '@/middlewares/authMiddleware'
import { prisma } from '@/prisma/client'

const router = Router()

// Public endpoint (gets approved testimonials or product-specific reviews)
router.get('/', async (req: Request, res: Response) => {
  try {
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined
    const testimonials = await testimonialService.getActive(productId)
    return res.json(testimonials)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar testimonials' })
  }
})

// Public endpoint to submit a review (needs authentication, defaults to inactive/moderated)
router.post('/review', authMiddleware, async (req: any, res: Response) => {
  try {
    const { rating, text, productId } = req.body

    if (!rating || !text || !productId) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }

    // Verify user exists and get name
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const clientName = user?.name || 'Cliente Verificado'

    const testimonial = await testimonialService.create({
      clientName,
      rating: parseInt(rating),
      text,
      productId: parseInt(productId),
      isActive: false // Starts as inactive, requires admin moderation
    })

    return res.status(201).json(testimonial)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
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
    const { clientName, rating, text, productId, isActive } = req.body

    if (!clientName || !text || !rating) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }

    const testimonial = await testimonialService.create({
      clientName,
      rating: parseInt(rating),
      text,
      productId: productId ? parseInt(productId) : null,
      isActive: isActive !== undefined ? isActive : true
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
