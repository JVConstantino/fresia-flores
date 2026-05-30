'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { 
  ShoppingCart, Package, Users, DollarSign, 
  TrendingUp, Clock, CheckCircle, AlertCircle 
} from 'lucide-react'

interface Stats {
  totalOrders: number
  totalProducts: number
  totalUsers: number
  totalRevenue: number
  recentOrders: Array<{
    id: number
    status: string
    total: number
    customerName: string
    createdAt: string
  }>
  lowStockProducts: Array<{
    id: number
    name: string
    stock: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-ink-500">Carregando...</div>
  }

  if (!stats) {
    return <div className="text-center py-12 text-ink-500">Erro ao carregar dados</div>
  }

  const kpis = [
    { label: 'Pedidos', value: stats.totalOrders, icon: ShoppingCart, color: 'text-lilac-500' },
    { label: 'Produtos', value: stats.totalProducts, icon: Package, color: 'text-petal-500' },
    { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'text-leaf-500' },
    { label: 'Receita', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-warm-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-ink-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-500">{label}</span>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-display font-semibold text-ink-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">
            Pedidos Recentes
          </h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-ink-500 text-sm">Nenhum pedido recente</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-ink-800">#{order.id}</p>
                    <p className="text-xs text-ink-500">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink-800">
                      R$ {Number(order.total).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'confirmed' ? 'bg-lilac-100 text-lilac-700' :
                      'bg-ink-100 text-ink-700'
                    }`}>
                      {order.status === 'delivered' ? 'Entregue' :
                       order.status === 'confirmed' ? 'Confirmado' :
                       'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">
            Estoque Baixo
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-ink-500 text-sm">Todos os produtos com estoque ok</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{product.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {product.stock} unidades
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
