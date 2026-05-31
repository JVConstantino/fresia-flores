import { Router, Request, Response } from 'express'
import { newsletterService } from '@/services/newsletterService'

const router = Router()

router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email inválido' })
    }

    if (email.length > 100) {
      return res.status(400).json({ error: 'Email muito longo' })
    }

    const result = await newsletterService.subscribe(email)
    return res.status(201).json(result)
  } catch (err: any) {
    if (err.message.includes('já inscrito')) {
      return res.status(409).json({ error: err.message })
    }
    return res.status(500).json({ error: 'Erro ao inscrever' })
  }
})

export const newsletterController = router
