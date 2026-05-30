import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

export interface Product {
  $id: string
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  images: string
  isActive: boolean
  categoryId: string
}

export interface ProductVariant {
  $id: string
  productId: string
  name: string
  price: number
  stock: number
}

export const productService = {
  async findAll(categoryIds?: string[], sort = 'newest', limit?: number, excludeSlug?: string): Promise<Product[]> {
    const queries = [Query.equal('isActive', true)]
    if (limit) queries.push(Query.limit(limit))
    if (sort === 'newest') queries.push(Query.orderDesc('$createdAt'))
    if (sort === 'price_asc') queries.push(Query.orderAsc('price'))
    if (sort === 'price_desc') queries.push(Query.orderDesc('price'))

    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.products, queries)
    let products = documents as unknown as Product[]

    if (categoryIds && categoryIds.length > 0) {
      products = products.filter(p => categoryIds.includes(p.categoryId))
    }

    if (excludeSlug) {
      products = products.filter(p => p.slug !== excludeSlug)
    }

    return products
  },

  async findBySlug(slug: string) {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.products, [Query.equal('slug', slug)])
    return documents[0] as unknown as Product | null
  },

  async getVariants(productId: string): Promise<ProductVariant[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.product_variants, [
      Query.equal('productId', productId)
    ])
    return documents as unknown as ProductVariant[]
  },

  async findFeatured(limit = 8): Promise<Product[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.products, [
      Query.equal('isActive', true),
      Query.orderDesc('price'),
      Query.limit(limit)
    ])
    return documents as unknown as Product[]
  }
}
