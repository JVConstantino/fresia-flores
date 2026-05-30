import { api } from '@/lib/axios'
import type { AuthUser } from '@/store/authStore'

export interface RegisterData {
  name: string
  email: string
  phone?: string
  password: string
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  async register(payload: RegisterData): Promise<AuthUser> {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // already logged out
    }
  },

  async me(): Promise<AuthUser | null> {
    try {
      const { data } = await api.get('/auth/me')
      return data
    } catch {
      return null
    }
  },

  async syncWishlist(localIds: number[]): Promise<number[]> {
    try {
      const { data } = await api.post('/account/wishlist/sync', { localIds })
      return data.mergedIds || localIds
    } catch {
      return localIds
    }
  },
}
