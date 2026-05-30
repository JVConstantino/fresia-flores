import { prisma } from '@/prisma/client'
import axios from 'axios'
import crypto from 'crypto'

export type WebhookEvent =
  | 'order.created'
  | 'order.updated'
  | 'order.paid'
  | 'product.low_stock'
  | 'newsletter.subscribed'
  | 'testimonial.created'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: unknown
}

export const webhookService = {
  async getAll() {
    return prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { logs: true } }
      }
    })
  },

  async getById(id: number) {
    return prisma.webhook.findUnique({
      where: { id },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 50 } }
    })
  },

  async create(data: {
    name: string
    url: string
    events: string[]
    secret?: string
    isActive?: boolean
  }) {
    return prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        events: JSON.stringify(data.events),
        secret: data.secret,
        isActive: data.isActive ?? true,
      }
    })
  },

  async update(id: number, data: {
    name?: string
    url?: string
    events?: string[]
    secret?: string | null
    isActive?: boolean
  }) {
    return prisma.webhook.update({
      where: { id },
      data: {
        ...data,
        events: data.events ? JSON.stringify(data.events) : undefined,
        secret: data.secret === null ? null : data.secret,
      }
    })
  },

  async delete(id: number) {
    return prisma.webhook.delete({ where: { id } })
  },

  async getLogs(webhookId: number, limit = 50) {
    return prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },

  async clearLogs(webhookId: number) {
    return prisma.webhookLog.deleteMany({ where: { webhookId } })
  }
}

export async function triggerWebhooks(event: WebhookEvent, data: unknown) {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true }
  })

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const payloadStr = JSON.stringify(payload)

  for (const wh of webhooks) {
    let events: string[] = []
    try {
      events = JSON.parse(wh.events)
    } catch {
      events = []
    }

    if (!events.includes(event)) continue

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Fresia-Event': event,
    }

    if (wh.secret) {
      const signature = crypto
        .createHmac('sha256', wh.secret)
        .update(payloadStr)
        .digest('hex')
      headers['X-Fresia-Signature'] = signature
    }

    try {
      const response = await axios.post(wh.url, payload, {
        headers,
        timeout: 15000,
        validateStatus: () => true,
      })

      await prisma.webhookLog.create({
        data: {
          webhookId: wh.id,
          event,
          payload: payloadStr,
          statusCode: response.status,
          response: JSON.stringify(response.data).slice(0, 2000),
          success: response.status >= 200 && response.status < 300,
        }
      })
    } catch (err: any) {
      await prisma.webhookLog.create({
        data: {
          webhookId: wh.id,
          event,
          payload: payloadStr,
          statusCode: null,
          response: err?.message?.slice(0, 2000) ?? 'Unknown error',
          success: false,
        }
      })
    }
  }
}
