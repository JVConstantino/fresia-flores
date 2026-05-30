import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

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
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.banners, [
      Query.equal('isActive', true),
      Query.orderAsc('order')
    ])
    return documents as unknown as Banner[]
  },

  async getAllBanners(): Promise<Banner[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.banners, [Query.orderAsc('order')])
    return documents as unknown as Banner[]
  },

  async createBanner(data: Omit<Banner, '$id'>) {
    return databases.createDocument(DATABASE_ID, COLLECTIONS.banners, ID.unique(), data)
  },

  async updateBanner(id: string, data: Partial<Banner>) {
    return databases.updateDocument(DATABASE_ID, COLLECTIONS.banners, id, data)
  },

  async deleteBanner(id: string) {
    return databases.deleteDocument(DATABASE_ID, COLLECTIONS.banners, id)
  },

  // Top Bar
  async getTopBar(): Promise<TopBar | null> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.top_bar, [Query.equal('isActive', true)])
    if (!documents.length) return null

    const bar = documents[0] as unknown as TopBar
    const now = new Date()
    if (bar.activeFrom && new Date(bar.activeFrom) > now) return null
    if (bar.activeTo && new Date(bar.activeTo) < now) return null
    return bar
  },

  async getAllTopBars(): Promise<TopBar[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.top_bar, [Query.orderDesc('$createdAt')])
    return documents as unknown as TopBar[]
  },

  async createTopBar(data: Omit<TopBar, '$id'>) {
    return databases.createDocument(DATABASE_ID, COLLECTIONS.top_bar, ID.unique(), data)
  },

  async updateTopBar(id: string, data: Partial<TopBar>) {
    return databases.updateDocument(DATABASE_ID, COLLECTIONS.top_bar, id, data)
  },

  async deleteTopBar(id: string) {
    return databases.deleteDocument(DATABASE_ID, COLLECTIONS.top_bar, id)
  },

  // Popups
  async getPopups(): Promise<Popup[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.popups, [Query.equal('isActive', true)])
    return documents as unknown as Popup[]
  },

  async getAllPopups(): Promise<Popup[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.popups, [Query.orderDesc('$createdAt')])
    return documents as unknown as Popup[]
  },

  async createPopup(data: Omit<Popup, '$id'>) {
    return databases.createDocument(DATABASE_ID, COLLECTIONS.popups, ID.unique(), data)
  },

  async updatePopup(id: string, data: Partial<Popup>) {
    return databases.updateDocument(DATABASE_ID, COLLECTIONS.popups, id, data)
  },

  async deletePopup(id: string) {
    return databases.deleteDocument(DATABASE_ID, COLLECTIONS.popups, id)
  },
}
