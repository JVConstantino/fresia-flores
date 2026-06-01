import { api } from '@/lib/axios'

export const adminStatsService = {
  getOverviewStats: async () => {
    const { data } = await api.get('/admin/stats/overview')
    return data
  },
  getSalesChart: async (days: number = 30) => {
    const { data } = await api.get('/admin/stats/sales-chart', { params: { days } })
    return data
  },
  getRevenueByCategory: async () => {
    const { data } = await api.get('/admin/stats/revenue-by-category')
    return data
  },
  getTopProducts: async (limit: number = 5) => {
    const { data } = await api.get('/admin/stats/top-products', { params: { limit } })
    return data
  },
  getOrdersStatus: async () => {
    const { data } = await api.get('/admin/stats/orders-status')
    return data
  },
  getAdvanced: async (days: number = 30) => {
    const { data } = await api.get('/admin/stats/advanced', { params: { days } })
    return data
  }
}
