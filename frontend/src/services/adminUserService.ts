import { api } from '@/lib/axios'

export interface AdminUser {
  id: number
  name: string
  email: string
  phone?: string | null
  isAdmin: boolean
  isSuspended: boolean
  avatarUrl?: string | null
  createdAt: string
  orderCount: number
  totalSpent: number
}

export interface AdminUserDetail extends AdminUser {
  mustChangePassword: boolean
  addresses: {
    id: number
    street: string
    number: string
    complement?: string | null
    neighborhood: string
    city: string
    state: string
    zipCode: string
    isDefault: boolean
  }[]
  paymentCards: {
    id: number
    brand: string
    lastFour: string
    nickname?: string | null
    isDefault: boolean
    createdAt: string
  }[]
  orders: {
    id: number
    status: string
    total: number
    createdAt: string
    items: { qty: number; price: number; product: { name: string } }[]
  }[]
}

export const adminUserService = {
  async create(body: { name: string; email: string; password: string; phone?: string; role: 'buyer' | 'admin' }) {
    const { data } = await api.post('/admin/users', body)
    return data
  },

  async list(params?: { search?: string; status?: string; page?: number }) {
    const { data } = await api.get('/admin/users', { params })
    return data as { data: AdminUser[]; pagination: { total: number; page: number; limit: number } }
  },

  async getById(id: number) {
    const { data } = await api.get(`/admin/users/${id}`)
    return data as AdminUserDetail
  },

  async update(id: number, body: { name?: string; phone?: string }) {
    const { data } = await api.patch(`/admin/users/${id}`, body)
    return data
  },

  async suspend(id: number, isSuspended: boolean) {
    const { data } = await api.post(`/admin/users/${id}/suspend`, { isSuspended })
    return data
  },

  async resetPassword(id: number) {
    const { data } = await api.post(`/admin/users/${id}/reset-password`)
    return data
  },

  async setTempPassword(id: number, tempPassword: string) {
    const { data } = await api.post(`/admin/users/${id}/temp-password`, { tempPassword })
    return data
  }
}
