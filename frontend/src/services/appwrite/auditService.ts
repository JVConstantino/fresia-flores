import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

export interface AuditLog {
  $id: string
  userId: string
  action: 'create' | 'update' | 'delete'
  entity: string
  entityId: string
  diff: string | null
  ip: string | null
  $createdAt: string
}

export const auditService = {
  async getAll(page = 1, pageSize = 20, filters?: { userId?: string; entity?: string; action?: string }): Promise<{ items: AuditLog[]; total: number }> {
    const queries: string[] = [Query.orderDesc('$createdAt'), Query.limit(pageSize)]
    if (page > 1) queries.push(Query.offset((page - 1) * pageSize))
    if (filters?.userId) queries.push(Query.equal('userId', filters.userId))
    if (filters?.entity) queries.push(Query.equal('entity', filters.entity))
    if (filters?.action) queries.push(Query.equal('action', filters.action))

    const { documents, total } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.audit_logs, queries)
    return { items: documents as unknown as AuditLog[], total }
  },

  async log(entry: { userId: string; action: AuditLog['action']; entity: string; entityId: string; diff?: object }): Promise<AuditLog> {
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.audit_logs, ID.unique(), {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      diff: entry.diff ? JSON.stringify(entry.diff) : null,
      ip: null,
    })
    return doc as unknown as AuditLog
  }
}
