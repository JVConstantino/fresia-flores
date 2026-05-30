import { api } from '@/lib/axios'

export interface Testimonial {
  id: number
  clientName: string
  text: string
  rating: number
  isActive: boolean
  createdAt: string
}

export const adminTestimonialService = {
  getAll: async (): Promise<Testimonial[]> => {
    const { data } = await api.get('/testimonials/admin')
    return data.data ?? data
  },

  update: async (id: number, patch: Partial<Pick<Testimonial, 'isActive' | 'text' | 'rating'>>): Promise<Testimonial> => {
    const { data } = await api.put(`/testimonials/admin/${id}`, patch)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/testimonials/admin/${id}`)
  }
}
