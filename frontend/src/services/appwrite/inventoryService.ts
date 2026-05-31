import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

export interface InventoryMovement {
  $id: string
  productId: string
  variantId: string | null
  type: 'in' | 'out' | 'reserve' | 'release'
  qty: number
  reason: string
  orderId: string | null
  userId: string
  $createdAt: string
}

export const inventoryService = {
  async getMovements(productId: string, limit = 50): Promise<InventoryMovement[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.inventory_movements, [
      Query.equal('productId', productId),
      Query.orderDesc('$createdAt'),
      Query.limit(limit)
    ])
    return documents as unknown as InventoryMovement[]
  },

  async getAllMovements(page = 1, pageSize = 20): Promise<{ items: InventoryMovement[]; total: number }> {
    const queries = [Query.orderDesc('$createdAt'), Query.limit(pageSize), Query.offset((page - 1) * pageSize)]
    const { documents, total } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.inventory_movements, queries)
    return { items: documents as unknown as InventoryMovement[], total }
  },

  async addMovement(data: {
    productId: string
    variantId?: string | null
    type: InventoryMovement['type']
    qty: number
    reason: string
    orderId?: string | null
    userId: string
  }): Promise<InventoryMovement> {
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.inventory_movements, ID.unique(), {
      productId: data.productId,
      variantId: data.variantId ?? null,
      type: data.type,
      qty: data.qty,
      reason: data.reason,
      orderId: data.orderId ?? null,
      userId: data.userId,
    })
    return doc as unknown as InventoryMovement
  },

  async reserveStock(productId: string, qty: number, orderId: string, userId: string, variantId?: string | null) {
    const docId = variantId || productId
    const collection = variantId ? COLLECTIONS.product_variants : COLLECTIONS.products

    const { documents } = await databases.listDocuments(DATABASE_ID, collection, [Query.equal('$id', docId)])
    if (!documents.length) throw new Error('Produto não encontrado')
    
    const product = documents[0] as any
    if (product.stock < qty) throw new Error('Estoque insuficiente')

    await databases.updateDocument(DATABASE_ID, collection, docId, { stock: product.stock - qty })

    return this.addMovement({
      productId,
      variantId: variantId ?? null,
      type: 'reserve',
      qty,
      reason: `Reserva para pedido #${orderId}`,
      orderId,
      userId,
    })
  },

  async releaseStock(productId: string, qty: number, orderId: string, userId: string, variantId?: string | null) {
    const docId = variantId || productId
    const collection = variantId ? COLLECTIONS.product_variants : COLLECTIONS.products

    const { documents } = await databases.listDocuments(DATABASE_ID, collection, [Query.equal('$id', docId)])
    if (!documents.length) return

    const product = documents[0] as any
    await databases.updateDocument(DATABASE_ID, collection, docId, { stock: product.stock + qty })

    return this.addMovement({
      productId,
      variantId: variantId ?? null,
      type: 'release',
      qty,
      reason: `Liberação de pedido #${orderId}`,
      orderId,
      userId,
    })
  },

  async checkStock(productId: string, variantId?: string | null): Promise<{ stock: number }> {
    const docId = variantId || productId
    const collection = variantId ? COLLECTIONS.product_variants : COLLECTIONS.products

    const { documents } = await databases.listDocuments(DATABASE_ID, collection, [Query.equal('$id', docId)])
    if (!documents.length) throw new Error('Não encontrado')

    return { stock: (documents[0] as any).stock }
  }
}
