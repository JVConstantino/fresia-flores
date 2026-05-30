import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

export interface Customer {
  $id: string
  userId: string
  name: string
  email: string
  ltv: number
  segment: 'vip' | 'regular' | 'inactive'
  notes: string[]
  totalOrders: number
  lastOrderAt: string | null
  $createdAt: string
}

export const customerService = {
  async getAll(page = 1, pageSize = 20, segment?: string): Promise<{ items: Customer[]; total: number }> {
    const queries: string[] = [Query.orderDesc('$createdAt'), Query.limit(pageSize)]
    if (page > 1) queries.push(Query.offset((page - 1) * pageSize))
    if (segment) queries.push(Query.equal('segment', segment))

    const { documents, total } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, queries)
    return { items: documents as unknown as Customer[], total }
  },

  async getById(userId: string): Promise<Customer | null> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [Query.equal('userId', userId)])
    if (!documents.length) return null
    return documents[0] as unknown as Customer
  },

  async updateNotes(userId: string, notes: string[]): Promise<Customer> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [Query.equal('userId', userId)])
    if (!documents.length) throw new Error('Cliente não encontrado')
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.customers, documents[0].$id, { notes })
    return doc as unknown as Customer
  },

  async updateSegment(userId: string, segment: string): Promise<Customer> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [Query.equal('userId', userId)])
    if (!documents.length) throw new Error('Cliente não encontrado')
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.customers, documents[0].$id, { segment })
    return doc as unknown as Customer
  },

  async updateLTV(userId: string, ltv: number) {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [Query.equal('userId', userId)])
    if (!documents.length) return
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.customers, documents[0].$id, { ltv })
  },

  async getLTV(userId: string): Promise<number> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.orders, [
      Query.equal('userId', userId),
      Query.equal('paymentStatus', 'paid')
    ])
    return (documents as any[]).reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  },

  getSegmentLabel(segment: string): string {
    const labels: Record<string, string> = {
      vip: 'VIP',
      regular: 'Regular',
      inactive: 'Inativo',
    }
    return labels[segment] || segment
  }
}
