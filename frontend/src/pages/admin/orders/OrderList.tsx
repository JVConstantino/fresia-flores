import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminOrderService } from '@/services/adminOrderService'
import { OrderDrawer } from '@/components/admin/OrderDrawer'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  waiting_quote: 'bg-amber-100 text-amber-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export function OrderList() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const result = await adminOrderService.getAll(1, 100)
      setOrders(result.items || result.data || [])
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = statusFilter && statusFilter !== 'all'
    ? orders.filter(o => o.status === statusFilter)
    : orders

  const handleBulkStatus = async (items: any[], nextStatus: string) => {
    try {
      await Promise.all(items.map((item) => adminOrderService.updateStatus(item.id, nextStatus)))
      toast.success(`${items.length} pedido(s) atualizado(s) para ${STATUS_LABELS[nextStatus] || nextStatus}`)
      loadOrders()
    } catch {
      toast.error('Erro ao atualizar pedidos em lote')
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (value: any) => <span className="font-mono font-semibold text-ink-700">#{value}</span>
    },
    {
      key: 'userId',
      label: 'Cliente',
      sortable: true,
      render: (_: any, row: any) => (
        <div>
          <p className="font-medium text-ink-800 text-sm">{row.customerName || row.user?.name || 'N/A'}</p>
          <p className="text-xs text-ink-400">{row.customerEmail}</p>
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value: any) => (
        <span className="font-semibold text-ink-800">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value))}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[value] || 'bg-ink-100 text-ink-600'}`}>
          {STATUS_LABELS[value] || value}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Pagamento',
      render: (value: string) => (
        <span className="text-xs text-ink-500">{value === 'pix' ? 'PIX' : 'Cartão'}</span>
      )
    },
    {
      key: 'paymentStatus',
      label: 'Pgto',
      render: (value: string) => (
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${PAYMENT_STATUS_COLORS[value] || 'bg-ink-100 text-ink-600'}`}>
          {value === 'waiting_quote' ? 'Cotação' : value === 'approved' || value === 'paid' ? 'Pago' : value === 'pending' ? 'Pendente' : value}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Data',
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('pt-BR')
    }
  ]

  const filters = [
    {
      label: 'Status',
      element: (
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ]

  return (
    <AdminLayout title="Pedidos" description="Gerenciar pedidos de clientes">
      <DataTable
        data={filteredOrders}
        columns={columns}
        loading={loading}
        filters={filters}
        enableSelection
        bulkActions={[
          { label: 'Marcar como pago', onClick: (items) => handleBulkStatus(items, 'paid'), variant: 'outline' },
          { label: 'Marcar como enviado', onClick: (items) => handleBulkStatus(items, 'shipped'), variant: 'outline' },
          { label: 'Cancelar pedidos', onClick: (items) => handleBulkStatus(items, 'cancelled'), variant: 'destructive' },
        ]}
        searchPlaceholder="Buscar por ID, cliente ou email..."
        onEdit={(order: any) => setSelectedOrderId(order.id)}
      />

      <OrderDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusUpdated={loadOrders}
      />
    </AdminLayout>
  )
}
