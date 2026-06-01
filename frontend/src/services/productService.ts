import { api } from '@/lib/axios'

export interface ProductVariant {
  id: number
  name: string
  description?: string | null
  price: number
  salePrice?: number | null
  stock: number
  images?: string | null
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  images: string
  category: ProductCategory
  variants: ProductVariant[]
}

export interface ProductFeatured {
  id: number
  name: string
  slug: string
  price: number
  images: string
  category: ProductCategory
}

export const productService = {
  async findAll(
    categoryIds?: number[],
    sort = 'newest',
    limit?: number,
    excludeSlug?: string,
    priceMin?: number,
    priceMax?: number,
    isFeatured?: boolean,
    hasPromotion?: boolean,
    search?: string
  ): Promise<Product[]> {
    const params = new URLSearchParams()
    params.append('sort', sort)
    if (categoryIds && categoryIds.length > 0) {
      categoryIds.forEach(id => params.append('categoryId', id.toString()))
    }
    if (limit) params.append('limit', limit.toString())
    if (excludeSlug) params.append('exclude', excludeSlug)
    if (priceMin !== undefined) params.append('priceMin', priceMin.toString())
    if (priceMax !== undefined) params.append('priceMax', priceMax.toString())
    if (isFeatured) params.append('isFeatured', '1')
    if (hasPromotion) params.append('hasPromotion', '1')
    if (search) params.append('search', search)

    const { data } = await api.get<Product[]>('/products', { params })
    return data
  },

  async findFeatured(): Promise<ProductFeatured[]> {
    const { data } = await api.get<ProductFeatured[]>('/products/featured')
    return data
  },

  async findBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${slug}`)
    return data
  },

  async getReviews(productId: number): Promise<any[]> {
    const { data } = await api.get(`/testimonials`, { params: { productId } })
    return data
  },

  async submitReview(productId: number, rating: number, text: string): Promise<any> {
    const { data } = await api.post(`/testimonials/review`, { productId, rating, text })
    return data
  },
}
