import { api } from '@/lib/axios'

export interface Category {
  id: number
  name: string
  slug: string
  imageUrl?: string | null
  _count: { products: number }
}

export const categoryService = {
  async findAll(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories')
    return data
  },
}
