import { prisma } from '@/prisma/client'

export const adminContentService = {
  async getBanners(): Promise<any[]> {
    const row = await prisma.setting.findUnique({ where: { key: 'content_banners' } })
    return row ? JSON.parse(row.value) : []
  },

  async saveBanners(banners: any[]): Promise<any[]> {
    await prisma.setting.upsert({
      where: { key: 'content_banners' },
      create: { key: 'content_banners', value: JSON.stringify(banners) },
      update: { value: JSON.stringify(banners) }
    })
    return banners
  },

  async getTopBars(): Promise<any[]> {
    const row = await prisma.setting.findUnique({ where: { key: 'content_topbars' } })
    return row ? JSON.parse(row.value) : []
  },

  async saveTopBars(topbars: any[]): Promise<any[]> {
    await prisma.setting.upsert({
      where: { key: 'content_topbars' },
      create: { key: 'content_topbars', value: JSON.stringify(topbars) },
      update: { value: JSON.stringify(topbars) }
    })
    return topbars
  },

  async getPopups(): Promise<any[]> {
    const row = await prisma.setting.findUnique({ where: { key: 'content_popups' } })
    return row ? JSON.parse(row.value) : []
  },

  async savePopups(popups: any[]): Promise<any[]> {
    await prisma.setting.upsert({
      where: { key: 'content_popups' },
      create: { key: 'content_popups', value: JSON.stringify(popups) },
      update: { value: JSON.stringify(popups) }
    })
    return popups
  }
}
