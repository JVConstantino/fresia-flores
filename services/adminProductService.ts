import { api } from '@/lib/axios'

export const adminProductService = {
  async getAll(page = 1, pageSize = 10, category?: number, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(category && { category: category.toString() }),
      ...(search && { search })
    })
    const { data } = await api.get(`/admin/products?${params}`)
    return data
  },

  async getById(id: number) {
    const { data } = await api.get(`/admin/products/${id}`)
    return data
  },

  async create(product: any) {
    const { data } = await api.post('/admin/products', product)
    return data
  },

  async update(id: number, product: any) {
    const { data } = await api.put(`/admin/products/${id}`, product)
    return data
  },

  async delete(id: number) {
    await api.delete(`/admin/products/${id}`)
  },

  async batchDelete(ids: number[]) {
    await api.post('/admin/products/batch-delete', { ids })
  }
}
