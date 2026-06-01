import { api } from '@/lib/axios'

export const adminOrderService = {
  async getAll(page = 1, pageSize = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status })
    })
    const { data } = await api.get(`/admin/orders?${params}`)
    return data
  },

  async getById(id: number) {
    const { data } = await api.get(`/admin/orders/${id}`)
    return data
  },

  async updateStatus(id: number, status: string) {
    const { data } = await api.patch(`/admin/orders/${id}`, { status })
    return data
  },

  async setDeliveryFee(id: number, deliveryFee: number) {
    const { data } = await api.patch(`/admin/orders/${id}/delivery-fee`, { deliveryFee })
    return data
  }
}
