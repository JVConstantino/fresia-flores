import { Router, Request, Response, NextFunction } from 'express'
import { webhookService, triggerWebhooks } from '@/services/webhookService'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await webhookService.getAll()
    res.json(items)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })
    const item = await webhookService.getById(id)
    if (!item) return res.status(404).json({ error: 'Webhook não encontrado' })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, url, events, secret, isActive } = req.body
    if (!name || !url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Nome, URL e eventos são obrigatórios' })
    }
    const item = await webhookService.create({ name, url, events, secret, isActive })
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })
    const { name, url, events, secret, isActive } = req.body
    const item = await webhookService.update(id, { name, url, events, secret, isActive })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })
    await webhookService.delete(id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/:id/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })
    const logs = await webhookService.getLogs(id, 100)
    res.json(logs)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })
    await webhookService.clearLogs(id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })
    const webhook = await webhookService.getById(id)
    if (!webhook) return res.status(404).json({ error: 'Webhook não encontrado' })

    let events: string[] = []
    try {
      events = JSON.parse(webhook.events)
    } catch {
      events = []
    }

    const event = events[0] || 'order.created'
    await triggerWebhooks(event as any, {
      test: true,
      message: 'Este é um evento de teste do Frésia Webhooks',
      webhookId: id,
    })

    res.json({ success: true, message: 'Evento de teste disparado' })
  } catch (err) {
    next(err)
  }
})

export const adminWebhookController = router
