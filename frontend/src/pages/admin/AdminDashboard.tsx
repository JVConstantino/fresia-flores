import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatCard } from '@/components/admin/StatCard'
import { ChartBar, ChartDonut } from '@/components/admin/Charts'
import { Skeleton } from '@/components/ui/skeleton'
import { BlurFade } from '@/components/ui/blur-fade'
import { useStats } from '@/hooks/useStats'
import { Users, DollarSign, ShoppingBag, Package } from 'lucide-react'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-14 h-6 rounded-full" />
            </div>
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-20 h-8" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-3 sm:gap-4">
        <div className="bg-white rounded-lg p-6 space-y-4">
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-full h-48" />
        </div>
        <div className="bg-white rounded-lg p-6 space-y-4">
          <Skeleton className="w-44 h-5" />
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-full h-48" />
        </div>
      </div>
    </div>
  )
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

  return (
    <AdminLayout title="Dashboard" description="Visão geral da loja">
      {isLoading && !overview ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <BlurFade delay={0.1} inView>
              <StatCard label="Total de Clientes" value={overview?.activeCustomers ?? 0} change={12} icon={Users} iconColor="lilac" />
            </BlurFade>
            <BlurFade delay={0.15} inView>
              <StatCard label="Faturamento" value={overview?.totalSales ? formatCurrency(overview.totalSales) : 'R$ 0,00'} change={8} icon={DollarSign} iconColor="leaf" />
            </BlurFade>
            <BlurFade delay={0.2} inView>
              <StatCard label="Pedidos no Período" value={overview?.totalOrders ?? 0} change={-3} icon={ShoppingBag} iconColor="petal" />
            </BlurFade>
            <BlurFade delay={0.25} inView>
              <StatCard label="Produtos Ativos" value={overview?.lowStockProducts != null ? 64 - overview.lowStockProducts : 0} change={5} icon={Package} iconColor="forest" />
            </BlurFade>
          </div>

          {/* Panels Row */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-3 sm:gap-4">
            {/* Bar Chart */}
            <BlurFade delay={0.3} inView>
              <div className="bg-white rounded-lg p-4 sm:p-6 min-w-0">
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

                <div className="min-w-0">
                  <ChartBar data={salesChart} />
                </div>
              </div>
            </BlurFade>

            {/* Donut Chart */}
            <BlurFade delay={0.35} inView>
              <div className="bg-white rounded-lg p-4 sm:p-6 min-w-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-ink-900">Receita por Categoria</h3>
                    <p className="text-xs text-ink-500 mt-1">Distribuição de vendas</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <ChartDonut data={revenueByCategory} />
                </div>
              </div>
            </BlurFade>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
