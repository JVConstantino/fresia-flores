import { api } from '@/lib/axios'

export interface SupplyCategory {
  id: number
  name: string
  _count?: { supplies: number }
}

export interface Supply {
  id: number
  name: string
  categoryId: number
  unit: string
  costPerUnit: number
  currentStock: number
  minStock: number
  supplier?: string | null
  notes?: string | null
  category?: SupplyCategory
  createdAt: string
}

export interface SupplyMovement {
  id: number
  supplyId: number
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  unitCost?: number | null
  totalCost?: number | null
  reason?: string | null
  reference?: string | null
  createdAt: string
}

export interface SupplyDetail extends Supply {
  movements: SupplyMovement[]
}

export const supplyService = {
  async listCategories(): Promise<SupplyCategory[]> {
    const { data } = await api.get<SupplyCategory[]>('/admin/supplies/categories')
    return data
  },
  async createCategory(name: string): Promise<SupplyCategory> {
    const { data } = await api.post<SupplyCategory>('/admin/supplies/categories', { name })
    return data
  },
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/admin/supplies/categories/${id}`)
  },
  async list(params?: { search?: string; lowStock?: boolean }): Promise<Supply[]> {
    const { data } = await api.get<Supply[]>('/admin/supplies', { params })
    return data
  },
  async get(id: number): Promise<SupplyDetail> {
    const { data } = await api.get<SupplyDetail>(`/admin/supplies/${id}`)
    return data
  },
  async create(body: Partial<Supply>): Promise<Supply> {
    const { data } = await api.post<Supply>('/admin/supplies', body)
    return data
  },
  async update(id: number, body: Partial<Supply>): Promise<Supply> {
    const { data } = await api.patch<Supply>(`/admin/supplies/${id}`, body)
    return data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/supplies/${id}`)
  },
  async addMovement(id: number, mov: { type: 'in' | 'out' | 'adjustment'; quantity: number; unitCost?: number; reason?: string; reference?: string }): Promise<SupplyMovement> {
    const { data } = await api.post<SupplyMovement>(`/admin/supplies/${id}/movements`, mov)
    return data
  },
  async financialReport(from?: string, to?: string) {
    const { data } = await api.get('/admin/supplies/financial-report', { params: { from, to } })
    return data as { from: string; to: string; total: number; byCategory: { category: string; value: number }[] }
  },
}
