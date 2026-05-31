import { api } from '@/lib/axios'

export const adminCategoryService = {
  async getAll(page = 1, pageSize = 10) {
    const { data } = await api.get(
      `/admin/categories?page=${page}&pageSize=${pageSize}`
    )
    return data
  },

  async create(category: any) {
    const { data } = await api.post('/admin/categories', category)
    return data
  },

  async update(id: number, category: any) {
    const { data } = await api.put(`/admin/categories/${id}`, category)
    return data
  },

  async delete(id: number) {
    await api.delete(`/admin/categories/${id}`)
  }
}
