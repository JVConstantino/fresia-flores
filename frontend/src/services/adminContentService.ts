import { api } from '@/lib/axios'

export interface Banner {
  $id: string
  title: string
  subtitle?: string
  image?: string
  ctaText?: string
  ctaLink?: string
  isActive: boolean
  order: number
}

export interface TopBar {
  $id: string
  text: string
  activeFrom?: string
  activeTo?: string
  isActive: boolean
}

export interface Popup {
  $id: string
  title: string
  body?: string
  ctaText?: string
  ctaLink?: string
  image?: string
  event: string
  delay?: number
  frequency: string
  isActive: boolean
}

const BASE = '/content/admin'

export const adminContentService = {
  // Banners
  async getBanners(): Promise<Banner[]> {
    const { data } = await api.get(`${BASE}/banners`)
    return Array.isArray(data) ? data : []
  },
  async createBanner(payload: Omit<Banner, '$id'>): Promise<Banner> {
    const { data } = await api.post(`${BASE}/banners`, payload)
    return data
  },
  async updateBanner(id: string, payload: Partial<Banner>): Promise<Banner> {
    const { data } = await api.put(`${BASE}/banners/${id}`, payload)
    return data
  },
  async deleteBanner(id: string): Promise<void> {
    await api.delete(`${BASE}/banners/${id}`)
  },

  // Top Bars
  async getTopBars(): Promise<TopBar[]> {
    const { data } = await api.get(`${BASE}/topbars`)
    return Array.isArray(data) ? data : []
  },
  async createTopBar(payload: Omit<TopBar, '$id'>): Promise<TopBar> {
    const { data } = await api.post(`${BASE}/topbars`, payload)
    return data
  },
  async updateTopBar(id: string, payload: Partial<TopBar>): Promise<TopBar> {
    const { data } = await api.put(`${BASE}/topbars/${id}`, payload)
    return data
  },
  async deleteTopBar(id: string): Promise<void> {
    await api.delete(`${BASE}/topbars/${id}`)
  },

  // Popups
  async getPopups(): Promise<Popup[]> {
    const { data } = await api.get(`${BASE}/popups`)
    return Array.isArray(data) ? data : []
  },
  async createPopup(payload: Omit<Popup, '$id'>): Promise<Popup> {
    const { data } = await api.post(`${BASE}/popups`, payload)
    return data
  },
  async updatePopup(id: string, payload: Partial<Popup>): Promise<Popup> {
    const { data } = await api.put(`${BASE}/popups/${id}`, payload)
    return data
  },
  async deletePopup(id: string): Promise<void> {
    await api.delete(`${BASE}/popups/${id}`)
  },
}
