import { AdminLayout } from '@/components/admin/AdminLayout'
import { useStats } from '@/hooks/useStats'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function AnalyticsPage() {
  const { advanced, isLoading, error } = useStats()

  if (error) {
    return (
      <AdminLayout title="Analises" description="Inteligencia de negocio da loja">
        <div className="p-8 text-center text-red-600">{error}</div>
      </AdminLayout>
    )
  }

  if (isLoading && !advanced) {
    return (
      <AdminLayout title="Analises" description="Inteligencia de negocio da loja">
        <div className="p-8 text-center text-ink-500">Carregando...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Analises" description="Produtos, clientes, geografia, financeiro e login">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-ink-500">Produtos Cadastrados</p>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{advanced?.kpis?.totalProducts ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-ink-500">Ticket Medio</p>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{formatCurrency(advanced?.kpis?.avgTicket ?? 0)}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-ink-500">Custo Operacional (30d)</p>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{formatCurrency(advanced?.kpis?.cost ?? 0)}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-ink-500">Lucro (30d)</p>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{formatCurrency(advanced?.kpis?.profit ?? 0)}</p>
          <p className="text-xs text-ink-500">Margem: {advanced?.kpis?.marginPct ?? 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <div className="bg-white rounded-lg p-5">
          <h3 className="font-semibold text-ink-900 mb-3">Produtos Mais Vistos (proxy)</h3>
          <div className="space-y-2">
            {(advanced?.topViewedProducts || []).slice(0, 8).map((p: any, idx: number) => (
              <div key={p.productId} className="flex items-center justify-between text-sm border-b border-ink-100 pb-1">
                <span className="text-ink-700">{idx + 1}. {p.name}</span>
                <span className="font-semibold text-ink-900">{p.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-5">
          <h3 className="font-semibold text-ink-900 mb-3">Itens Mais Buscados (proxy)</h3>
          <div className="space-y-2">
            {(advanced?.topSearchedTerms || []).slice(0, 8).map((t: any, idx: number) => (
              <div key={`${t.term}-${idx}`} className="flex items-center justify-between text-sm border-b border-ink-100 pb-1">
                <span className="text-ink-700">{idx + 1}. {t.term}</span>
                <span className="font-semibold text-ink-900">{t.hits}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <div className="bg-white rounded-lg p-5">
          <h3 className="font-semibold text-ink-900 mb-3">Ranking de Clientes</h3>
          <div className="space-y-2">
            {(advanced?.topCustomers || []).slice(0, 10).map((c: any, idx: number) => (
              <div key={`${c.email}-${idx}`} className="flex items-center justify-between text-sm border-b border-ink-100 pb-1">
                <div>
                  <p className="text-ink-800">{idx + 1}. {c.name}</p>
                  <p className="text-xs text-ink-500">{c.email} - {c.orders} pedido(s)</p>
                </div>
                <span className="font-semibold text-ink-900">{formatCurrency(c.spent)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-5">
          <h3 className="font-semibold text-ink-900 mb-3">Lugares com Mais Compras/Entregas</h3>
          <div className="space-y-2">
            {(advanced?.geography?.topNeighborhoods || []).slice(0, 10).map((g: any, idx: number) => (
              <div key={`${g.id}-${idx}`} className="flex items-center justify-between text-sm border-b border-ink-100 pb-1">
                <span className="text-ink-700">{idx + 1}. {g.neighborhood} - {g.city}</span>
                <span className="font-semibold text-ink-900">{g.orders}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 mt-3">
        <h3 className="font-semibold text-ink-900 mb-2">Analise de Login e Atividade</h3>
        <p className="text-sm text-ink-600">Novos usuarios (30d): <strong>{advanced?.loginMetrics?.newUsers ?? 0}</strong></p>
        <p className="text-sm text-ink-600">Clientes ativos (30d): <strong>{advanced?.loginMetrics?.activeCustomers ?? 0}</strong></p>
        {!advanced?.loginMetrics?.trackingEnabled && (
          <p className="text-xs text-amber-700 mt-2">{advanced?.loginMetrics?.note}</p>
        )}
      </div>
    </AdminLayout>
  )
}
