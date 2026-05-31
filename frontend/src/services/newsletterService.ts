import { api } from '@/lib/axios'

export const newsletterService = {
  subscribe: async (email: string) => {
    try {
      const { data } = await api.post('/newsletter/subscribe', { email })
      return data
    } catch (err: any) {
      if (err.response?.status === 409) {
        throw new Error('Email já está inscrito')
      }
      throw err
    }
  }
}
