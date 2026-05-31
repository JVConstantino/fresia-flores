import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatCard } from '@/components/admin/StatCard'
import { ChartBar, ChartDonut } from '@/components/admin/Charts'
import { useStats } from '@/hooks/useStats'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function AdminDashboard() {
  const { overview, salesChart, revenueByCategory, isLoading, error } = useStats()

  if (error) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da loja">
        <div className="p-8 text-center text-red-600">{error}</div>
      </AdminLayout>
    )
  }

  if (isLoading && !overview) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da loja">
        <div className="p-8 text-center text-ink-500">Carregando...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard" description="Visão geral da loja">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total de Clientes"
          value={overview?.activeCustomers ?? 0}
          change={12}
          icon="a"
        />
        <StatCard
          label="Faturamento"
          value={overview?.totalSales ? formatCurrency(overview.totalSales) : 'R$ 0,00'}
          change={8}
          icon="b"
        />
        <StatCard
          label="Pedidos no Período"
          value={overview?.totalOrders ?? 0}
          change={-3}
          icon="c"
        />
        <StatCard
          label="Produtos Ativos"
          value={overview?.lowStockProducts != null ? 64 - overview.lowStockProducts : 0}
          change={5}
          icon="d"
        />
      </div>

      {/* Panels Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-3 sm:gap-4">
        {/* Bar Chart */}
        <div className="bg-white border border-ink-200 rounded-lg p-4 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-ink-900">Vendas Recentes</h3>
              <p className="text-xs text-ink-500 mt-1">Últimos 12 meses</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-4 sm:mb-6">
            <div className="font-display text-2xl sm:text-3xl xl:text-4xl font-medium text-ink-900 break-words">
              {overview?.totalSales ? formatCurrency(overview.totalSales) : 'R$ 0,00'}
            </div>
          </div>

          <div className="min-w-0 overflow-x-auto">
            <ChartBar data={salesChart} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-ink-200 rounded-lg p-4 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-ink-900">Receita por Categoria</h3>
              <p className="text-xs text-ink-500 mt-1">Distribuição de vendas</p>
            </div>
          </div>

          <div className="min-w-0 overflow-x-auto">
            <ChartDonut data={revenueByCategory} />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
