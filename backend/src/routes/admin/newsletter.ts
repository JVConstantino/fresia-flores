import { Router, Request, Response } from 'express'
import { newsletterService } from '../../services/newsletterService'
import { prisma } from '../../prisma/client'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await newsletterService.getSubscriptions(1, 1000)
    return res.json(result.data)
  } catch {
    return res.status(500).json({ error: 'Erro ao listar inscrições' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string)
    await prisma.newsletterSubscription.delete({ where: { id } })
    return res.json({ success: true })
  } catch {
    return res.status(500).json({ error: 'Erro ao remover inscrição' })
  }
})

export default router
