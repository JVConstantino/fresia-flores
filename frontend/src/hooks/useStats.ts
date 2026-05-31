import { useState, useEffect } from 'react'
import { adminStatsService } from '@/services/adminStatsService'

interface OverviewStats {
  totalSales: number
  salesChange: number
  totalOrders: number
  ordersChange: number
  activeCustomers: number
  lowStockProducts: number
}

interface StatsData {
  overview: OverviewStats | null
  salesChart: Array<{ name: string; value: number }>
  revenueByCategory: Array<{ label: string; value: number; color: string }>
  topProducts: Array<{ name: string; value: number }>
  ordersStatus: Array<{ label: string; value: number; color: string }>
  advanced: any | null
  isLoading: boolean
  error: string | null
}

export function useStats(): StatsData {
  const [data, setData] = useState<StatsData>({
    overview: null,
    salesChart: [
      { name: 'Jan', value: 45 },
      { name: 'Fev', value: 62 },
      { name: 'Mar', value: 48 },
      { name: 'Abr', value: 78 },
      { name: 'Mai', value: 55 },
      { name: 'Jun', value: 89 },
      { name: 'Jul', value: 124 },
    ],
    revenueByCategory: [
      { label: 'Ads Pagos', value: 38, color: '#9b83e6' },
      { label: 'Redes Sociais', value: 28, color: '#f5a98c' },
      { label: 'Orgânico', value: 22, color: '#5a9e68' },
      { label: 'Indicação', value: 12, color: '#f5b878' },
    ],
    topProducts: [
      { name: 'Produto A', value: 214 },
      { name: 'Produto B', value: 178 },
      { name: 'Produto C', value: 142 },
      { name: 'Produto D', value: 98 },
    ],
    ordersStatus: [
      { label: 'Confirmados', value: 45, color: '#5a9e68' },
      { label: 'Pendentes', value: 28, color: '#f5a98c' },
      { label: 'Entregues', value: 22, color: '#9b83e6' },
    ],
    advanced: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const overview = await adminStatsService.getOverviewStats()
        setData(prev => ({
          ...prev,
          overview,
          isLoading: false
        }))
      } catch (err) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao carregar estatísticas'
        }))
      }
    }

    fetchStats()
  }, [])

  return data
}
