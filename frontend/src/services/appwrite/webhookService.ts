import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'
import axios from 'axios'
import CryptoJS from 'crypto-js'

export type WebhookEvent =
  | 'order.created'
  | 'order.updated'
  | 'order.paid'
  | 'order.shipped'
  | 'cart.abandoned'
  | 'customer.created'
  | 'product.low_stock'
  | 'newsletter.subscribed'
  | 'testimonial.created'

export interface Webhook {
  $id: string
  name: string
  url: string
  events: string
  secret: string | null
  isActive: boolean
  maxRetries: number
  $createdAt: string
}

export interface WebhookLog {
  $id: string
  webhookId: string
  event: string
  payload: string
  statusCode: number | null
  response: string | null
  success: boolean
  attempt: number
  $createdAt: string
}

export const webhookService = {
  async getAll(): Promise<Webhook[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.webhooks, [Query.orderDesc('$createdAt')])
    return documents as unknown as Webhook[]
  },

  async getById(id: string) {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.webhooks, [Query.equal('$id', id)])
    if (!documents.length) return null

    const logs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.webhook_logs, [
      Query.equal('webhookId', id),
      Query.orderDesc('$createdAt'),
      Query.limit(50)
    ])

    return { webhook: documents[0] as unknown as Webhook, logs: logs.documents as unknown as WebhookLog[] }
  },

  async create(data: { name: string; url: string; events: string[]; secret?: string; isActive?: boolean; maxRetries?: number }) {
    return databases.createDocument(DATABASE_ID, COLLECTIONS.webhooks, ID.unique(), {
      name: data.name,
      url: data.url,
      events: JSON.stringify(data.events),
      secret: data.secret || null,
      isActive: data.isActive ?? true,
      maxRetries: data.maxRetries ?? 3,
    })
  },

  async update(id: string, data: Partial<{ name: string; url: string; events: string[]; secret: string | null; isActive: boolean; maxRetries: number }>) {
    return databases.updateDocument(DATABASE_ID, COLLECTIONS.webhooks, id, {
      ...data,
      events: data.events ? JSON.stringify(data.events) : undefined,
    })
  },

  async delete(id: string) {
    return databases.deleteDocument(DATABASE_ID, COLLECTIONS.webhooks, id)
  },

  async getLogs(webhookId: string, limit = 50): Promise<WebhookLog[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.webhook_logs, [
      Query.equal('webhookId', webhookId),
      Query.orderDesc('$createdAt'),
      Query.limit(limit)
    ])
    return documents as unknown as WebhookLog[]
  },

  async clearLogs(webhookId: string) {
    const logs = await this.getLogs(webhookId, 100)
    for (const log of logs) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.webhook_logs, log.$id)
    }
  },

  async dispatchEvent(event: WebhookEvent, data: unknown): Promise<void> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.webhooks, [Query.equal('isActive', true)])
    const payload = { event, timestamp: new Date().toISOString(), data }
    const payloadStr = JSON.stringify(payload)

    for (const wh of documents as unknown as Webhook[]) {
      let events: string[] = []
      try { events = JSON.parse(wh.events) } catch {}
      if (!events.includes(event)) continue

      this.sendWithRetry(wh, event, payloadStr, 0, wh.maxRetries || 3)
    }
  },

  async sendWithRetry(webhook: Webhook, event: string, payloadStr: string, attempt: number, maxRetries: number) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Fresia-Event': event,
    }

    if (webhook.secret) {
      const signature = CryptoJS.HmacSHA256(payloadStr, webhook.secret).toString(CryptoJS.enc.Hex)
      headers['X-Fresia-Signature'] = signature
    }

    const retryDelays = [0, 30000, 120000, 300000] // 0s, 30s, 2min, 5min

    try {
      const response = await axios.post(webhook.url, JSON.parse(payloadStr), {
        headers,
        timeout: 15000,
        validateStatus: () => true,
      })

      await databases.createDocument(DATABASE_ID, COLLECTIONS.webhook_logs, ID.unique(), {
        webhookId: webhook.$id,
        event,
        payload: payloadStr,
        statusCode: response.status,
        response: JSON.stringify(response.data).slice(0, 2000),
        success: response.status >= 200 && response.status < 300,
        attempt: attempt + 1,
      })
    } catch (err: any) {
      const success = false

      await databases.createDocument(DATABASE_ID, COLLECTIONS.webhook_logs, ID.unique(), {
        webhookId: webhook.$id,
        event,
        payload: payloadStr,
        statusCode: null,
        response: err?.message?.slice(0, 2000) ?? 'Unknown error',
        success,
        attempt: attempt + 1,
      })

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt + 1] || retryDelays[retryDelays.length - 1]
        setTimeout(() => {
          this.sendWithRetry(webhook, event, payloadStr, attempt + 1, maxRetries)
        }, delay)
      }
    }
  },

  async fireTest(_webhookId: string) {
    const testPayload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      data: {
        id: '__test__',
        status: 'pending',
        total: 0,
        customerName: 'Cliente Teste',
        customerEmail: 'teste@fresia.com',
        items: [{ productName: 'Produto Teste', qty: 1, price: 0 }]
      }
    }
    await this.dispatchEvent('order.created' as WebhookEvent, testPayload.data)
    return { success: true, message: 'Evento de teste enviado' }
  }
}
