import { api } from '@/lib/axios'

export interface Banner {
  $id: string
  title: string
  subtitle: string | null
  image: string
  ctaText: string | null
  ctaLink: string | null
  isActive: boolean
  order: number
}

export interface TopBar {
  $id: string
  text: string
  activeFrom: string | null
  activeTo: string | null
  isActive: boolean
}

export interface Popup {
  $id: string
  title: string
  body: string | null
  ctaText: string | null
  ctaLink: string | null
  image: string | null
  event: 'exit_intent' | 'timer' | 'page'
  delay: number | null
  frequency: 'always' | 'once_per_session' | 'once_per_user'
  isActive: boolean
}

export const contentService = {
  // Banners
  async getBanners(): Promise<Banner[]> {
    const { data } = await api.get('/content/banners')
    return data
  },

  async getAllBanners(): Promise<Banner[]> {
    const { data } = await api.get('/content/admin/banners')
    return data
  },

  async createBanner(data: Omit<Banner, '$id'>) {
    const { data: res } = await api.post('/content/admin/banners', data)
    return res
  },

  async updateBanner(id: string, data: Partial<Banner>) {
    const { data: res } = await api.put(`/content/admin/banners/${id}`, data)
    return res
  },

  async deleteBanner(id: string) {
    await api.delete(`/content/admin/banners/${id}`)
  },

  // Top Bar
  async getTopBar(): Promise<TopBar | null> {
    const { data } = await api.get('/content/topbars')
    return data
  },

  async getAllTopBars(): Promise<TopBar[]> {
    const { data } = await api.get('/content/admin/topbars')
    return data
  },

  async createTopBar(data: Omit<TopBar, '$id'>) {
    const { data: res } = await api.post('/content/admin/topbars', data)
    return res
  },

  async updateTopBar(id: string, data: Partial<TopBar>) {
    const { data: res } = await api.put(`/content/admin/topbars/${id}`, data)
    return res
  },

  async deleteTopBar(id: string) {
    await api.delete(`/content/admin/topbars/${id}`)
  },

  // Popups
  async getPopups(): Promise<Popup[]> {
    const { data } = await api.get('/content/popups')
    return data
  },

  async getAllPopups(): Promise<Popup[]> {
    const { data } = await api.get('/content/admin/popups')
    return data
  },

  async createPopup(data: Omit<Popup, '$id'>) {
    const { data: res } = await api.post('/content/admin/popups', data)
    return res
  },

  async updatePopup(id: string, data: Partial<Popup>) {
    const { data: res } = await api.put(`/content/admin/popups/${id}`, data)
    return res
  },

  async deletePopup(id: string) {
    await api.delete(`/content/admin/popups/${id}`)
  },
}
