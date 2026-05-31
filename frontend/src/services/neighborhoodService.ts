import { api } from '@/lib/axios'

export interface City {
  id: number
  name: string
  state: string
  ibgeCode: string | null
  _count: { neighborhoods: number }
}

export interface Neighborhood {
  id: number
  cityId: number
  name: string
  deliveryFee: number
  isActive: boolean
}

export const neighborhoodService = {
  async getCities(): Promise<City[]> {
    const { data } = await api.get<City[]>('/cities')
    return data
  },

  async getNeighborhoods(cityId: number): Promise<Neighborhood[]> {
    const { data } = await api.get<Neighborhood[]>('/neighborhoods', { params: { cityId } })
    return data
  },

  async getAdminNeighborhoods(cityId?: number): Promise<Neighborhood[]> {
    const { data } = await api.get<Neighborhood[]>('/admin/neighborhoods', {
      params: cityId ? { cityId } : undefined,
    })
    return data
  },

  async createCity(name: string, state: string): Promise<City> {
    const { data } = await api.post<City>('/admin/cities', { name, state })
    return data
  },

  async updateCity(id: number, patch: Partial<{ name: string; state: string }>): Promise<City> {
    const { data } = await api.patch<City>(`/admin/cities/${id}`, patch)
    return data
  },

  async deleteCity(id: number): Promise<void> {
    await api.delete(`/admin/cities/${id}`)
  },

  async createNeighborhood(cityId: number, name: string, deliveryFee: number): Promise<Neighborhood> {
    const { data } = await api.post<Neighborhood>('/admin/neighborhoods', { cityId, name, deliveryFee })
    return data
  },

  async updateNeighborhood(id: number, patch: Partial<{ name: string; deliveryFee: number; isActive: boolean }>): Promise<Neighborhood> {
    const { data } = await api.patch<Neighborhood>(`/admin/neighborhoods/${id}`, patch)
    return data
  },

  async deleteNeighborhood(id: number): Promise<void> {
    await api.delete(`/admin/neighborhoods/${id}`)
  },
}
