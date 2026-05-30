import { api } from '@/lib/axios'

export const adminPromotionService = {
  async getAll(page = 1, pageSize = 10, status?: string, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status }),
      ...(search && { search })
    })
    const { data } = await api.get(`/admin/promotions?${params}`)
    return data
  },

  async getById(id: number) {
    const { data } = await api.get(`/admin/promotions/${id}`)
    return data
  },

  async create(promotion: any) {
    const { data } = await api.post('/admin/promotions', promotion)
    return data
  },

  async update(id: number, promotion: any) {
    const { data } = await api.put(`/admin/promotions/${id}`, promotion)
    return data
  },

  async delete(id: number) {
    await api.delete(`/admin/promotions/${id}`)
  }
}
