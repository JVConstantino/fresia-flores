import { api } from '@/lib/axios'

export const homeService = {
  getCategories: async () => {
    const { data } = await api.get('/categories')
    return data
  },

  getPromotions: async () => {
    const { data } = await api.get('/promotions/active')
    return data.map((promo: any) => ({
      ...promo,
      products: promo.products?.map((p: any) => ({
        ...p,
        price: Number(p.price),
        images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images ?? [])
      })) ?? []
    }))
  },

  getTestimonials: async () => {
    const { data } = await api.get('/testimonials')
    return data
  },

  searchProducts: async (query: string, limit: number = 20) => {
    const { data } = await api.get('/products', {
      params: { search: query, limit }
    })
    return data
  },

  getTrendingProducts: async (limit: number = 8) => {
    const { data } = await api.get('/products', {
      params: { limit, sort: 'newest' }
    })
    return data.map((p: any) => ({
      ...p,
      price: Number(p.price),
      images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images ?? [])
    }))
  }
}
