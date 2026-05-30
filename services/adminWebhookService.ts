import axios from 'axios'
import { getCookie } from '@/lib/cookies'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const api = axios.create({
  baseURL: `${API_URL}/admin/webhooks`,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getCookie('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface Webhook {
  id: number
  name: string
  url: string
  events: string
  secret: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { logs: number }
}

export interface WebhookLog {
  id: number
  webhookId: number
  event: string
  payload: string
  statusCode: number | null
  response: string | null
  success: boolean
  createdAt: string
}

export interface WebhookWithLogs extends Webhook {
  logs: WebhookLog[]
}

export const adminWebhookService = {
  getAll: () => api.get<Webhook[]>('').then(r => r.data),
  getById: (id: number) => api.get<WebhookWithLogs>(`/${id}`).then(r => r.data),
  create: (data: {
    name: string
    url: string
    events: string[]
    secret?: string
    isActive?: boolean
  }) => api.post<Webhook>('', data).then(r => r.data),
  update: (id: number, data: Partial<{
    name: string
    url: string
    events: string[]
    secret: string | null
    isActive: boolean
  }>) => api.put<Webhook>(`/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/${id}`),
  getLogs: (id: number) => api.get<WebhookLog[]>(`/${id}/logs`).then(r => r.data),
  clearLogs: (id: number) => api.delete(`/${id}/logs`),
  test: (id: number) => api.post<{ success: boolean; message: string }>(`/${id}/test`).then(r => r.data),
}
