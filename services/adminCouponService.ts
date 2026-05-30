import { api } from '@/lib/axios'

export const adminCouponService = {
  async getAll(page = 1, pageSize = 20, status?: string, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status }),
      ...(search && { search })
    })
    const { data } = await api.get(`/admin/coupons?${params}`)
    return data
  },

  async getById(id: number) {
    const { data } = await api.get(`/admin/coupons/${id}`)
    return data
  },

  async create(coupon: any) {
    const { data } = await api.post('/admin/coupons', coupon)
    return data
  },

  async update(id: number, coupon: any) {
    const { data } = await api.put(`/admin/coupons/${id}`, coupon)
    return data
  },

  async delete(id: number) {
    await api.delete(`/admin/coupons/${id}`)
  }
}
