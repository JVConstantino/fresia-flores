'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, Package } from 'lucide-react'

interface Order {
  id: number
  status: string
  paymentStatus: string
  total: number
  customerName: string
  customerEmail: string
  createdAt: string
  items: Array<{
    productName: string
    qty: number
    price: number
  }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-lilac-100 text-lilac-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const res = await api.get('/admin/orders')
      setOrders(res.data)
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderId: number, newStatus: string) {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status: newStatus })
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const filteredOrders = orders.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toString().includes(search)
  )

  if (loading) {
    return <div className="text-center py-12 text-ink-500">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Pedidos</h1>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Buscar por ID ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Pedido</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Total</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Pagamento</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Data</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-ink-100 hover:bg-ink-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-ink-800">#{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-ink-800">{order.customerName}</p>
                      <p className="text-xs text-ink-500">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-ink-800">
                      R$ {Number(order.total).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-ink-100 text-ink-700'}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.paymentStatus === 'approved' ? 'Aprovado' :
                       order.paymentStatus === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink-500">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <Button variant="ghost" size="sm">
                        <Eye size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
