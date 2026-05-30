import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

export interface Notification {
  $id: string
  userId: string
  type: 'order' | 'new_payment' | 'low_stock' | 'review'
  message: string
  read: boolean
  entityType: string | null
  entityId: string | null
  $createdAt: string
}

export const notificationService = {
  async getAll(userId: string, unreadOnly = false): Promise<Notification[]> {
    const queries = [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(50)]
    if (unreadOnly) queries.push(Query.equal('read', false))

    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, queries)
    return documents as unknown as Notification[]
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { total } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
      Query.equal('userId', userId),
      Query.equal('read', false)
    ])
    return total
  },

  async markAsRead(notificationId: string): Promise<void> {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, notificationId, { read: true })
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
      Query.equal('userId', userId),
      Query.equal('read', false)
    ])
    for (const doc of documents) {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, doc.$id, { read: true })
    }
  },

  async create(data: {
    userId: string
    type: Notification['type']
    message: string
    entityType?: string
    entityId?: string
  }): Promise<Notification> {
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.notifications, ID.unique(), {
      userId: data.userId,
      type: data.type,
      message: data.message,
      read: false,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    })
    return doc as unknown as Notification
  },

  async delete(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.notifications, id)
  }
}
