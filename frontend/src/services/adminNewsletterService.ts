import { api } from '@/lib/axios'

export interface NewsletterSubscriber {
  id: number
  email: string
  active: boolean
  createdAt: string
}

export const adminNewsletterService = {
  getAll: async (): Promise<NewsletterSubscriber[]> => {
    const { data } = await api.get('/admin/newsletter')
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/newsletter/${id}`)
  }
}
