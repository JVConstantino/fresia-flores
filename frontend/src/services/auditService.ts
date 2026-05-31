import { api } from '@/lib/axios'

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  userId: string | null
  diff: string | null
  createdAt: string
}

export const auditService = {
  async list(page = 1, limit = 20, entity?: string) {
    const { data } = await api.get('/admin/audit', { params: { page, limit, entity } })
    return data as { items: AuditLog[]; total: number; page: number; limit: number }
  },
}
