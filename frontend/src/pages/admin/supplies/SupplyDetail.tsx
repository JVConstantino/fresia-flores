import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowDown, ArrowUp, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supplyService, type SupplyDetail as SD } from '@/services/supplyService'

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR')
}

const TYPE_LABEL: Record<string, { label: string; icon: any; color: string }> = {
  in: { label: 'Entrada', icon: ArrowDown, color: 'text-green-600' },
  out: { label: 'Saída', icon: ArrowUp, color: 'text-red-600' },
  adjustment: { label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600' },
}

export function SupplyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [supply, setSupply] = useState<SD | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMovForm, setShowMovForm] = useState(false)
  const [movType, setMovType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [movQty, setMovQty] = useState('')
  const [movCost, setMovCost] = useState('')
  const [movReason, setMovReason] = useState('')
  const [movRef, setMovRef] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    supplyService.get(Number(id))
      .then(setSupply)
      .catch(() => toast.error('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmitMov() {
    if (!movQty || isNaN(Number(movQty))) {
      toast.error('Informe a quantidade')
      return
    }
    setSaving(true)
    try {
      await supplyService.addMovement(Number(id), {
        type: movType,
        quantity: Number(movQty),
        unitCost: movCost ? Number(movCost) : undefined,
        reason: movReason || undefined,
        reference: movRef || undefined,
      })
      const updated = await supplyService.get(Number(id))
      setSupply(updated)
      setShowMovForm(false)
      setMovQty(''); setMovCost(''); setMovReason(''); setMovRef('')
      toast.success('Movimentação registrada')
    } catch {
      toast.error('Erro ao registrar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLayout title="Carregando..."><div className="text-center py-12 text-ink-400">Carregando...</div></AdminLayout>
  }
  if (!supply) {
    return <AdminLayout title="Não encontrado"><div className="text-center py-12 text-ink-400">Suprimento não encontrado</div></AdminLayout>
  }

  const totalValue = Number(supply.currentStock) * Number(supply.costPerUnit)

  return (
    <AdminLayout title={supply.name} description={supply.category?.name}>
      <Button variant="outline" size="sm" onClick={() => navigate('/admin/suprimentos')} className="gap-2 mb-4">
        <ArrowLeft size={14} /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-ink-200 rounded-xl p-4">
              <p className="text-xs text-ink-500 uppercase mb-1">Estoque atual</p>
              <p className="text-2xl font-display text-ink-800">{Number(supply.currentStock).toFixed(2)}</p>
              <p className="text-xs text-ink-400">{supply.unit}</p>
            </div>
            <div className="bg-white border border-ink-200 rounded-xl p-4">
              <p className="text-xs text-ink-500 uppercase mb-1">Custo unitário</p>
              <p className="text-2xl font-display text-ink-800">{formatPrice(Number(supply.costPerUnit))}</p>
            </div>
            <div className="bg-white border border-ink-200 rounded-xl p-4">
              <p className="text-xs text-ink-500 uppercase mb-1">Valor em estoque</p>
              <p className="text-2xl font-display text-lilac-600">{formatPrice(totalValue)}</p>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink-800">Histórico de movimentações</h3>
              <Button size="sm" onClick={() => setShowMovForm(true)} className="bg-lilac-500 hover:bg-lilac-600">
                + Movimentação
              </Button>
            </div>
            {supply.movements.length === 0 ? (
              <div className="py-12 text-center text-ink-400">Nenhuma movimentação ainda</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink-50 border-b border-ink-100">
                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Tipo</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Qtd</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500 hidden md:table-cell">Custo total</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500 hidden md:table-cell">Referência</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {supply.movements.map(m => {
                    const cfg = TYPE_LABEL[m.type] ?? TYPE_LABEL.adjustment
                    const Icon = cfg.icon
                    return (
                      <tr key={m.id}>
                        <td className="px-4 py-2.5">
                          <div className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
                            <Icon size={12} /> {cfg.label}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-ink-700">{Number(m.quantity).toFixed(2)} {supply.unit}</td>
                        <td className="px-4 py-2.5 text-right text-ink-600 hidden md:table-cell">
                          {m.totalCost ? formatPrice(Number(m.totalCost)) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-ink-500 hidden md:table-cell">{m.reference || m.reason || '—'}</td>
                        <td className="px-4 py-2.5 text-ink-500 text-xs">{formatDate(m.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside>
          <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3 sticky top-24">
            <h3 className="text-sm font-semibold text-ink-800">Detalhes</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-ink-500">Unidade:</span> <span className="font-medium">{supply.unit}</span></div>
              <div><span className="text-ink-500">Estoque mínimo:</span> <span className="font-medium">{Number(supply.minStock).toFixed(2)} {supply.unit}</span></div>
              {supply.supplier && <div><span className="text-ink-500">Fornecedor:</span> <span className="font-medium">{supply.supplier}</span></div>}
              {supply.notes && <div><p className="text-ink-500">Notas:</p><p className="text-ink-700 text-xs">{supply.notes}</p></div>}
            </div>
          </div>
        </aside>
      </div>

      {showMovForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowMovForm(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Registrar movimentação</h3>
              <button onClick={() => setShowMovForm(false)} className="text-ink-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(['in', 'out', 'adjustment'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setMovType(t)}
                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      movType === t ? 'border-lilac-500 bg-lilac-50 text-lilac-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    {TYPE_LABEL[t].label}
                  </button>
                ))}
              </div>
              <Input type="number" step="0.01" value={movQty} onChange={e => setMovQty(e.target.value)} placeholder="Quantidade" />
              {movType === 'in' && (
                <Input type="number" step="0.01" value={movCost} onChange={e => setMovCost(e.target.value)} placeholder={`Custo unitário (default ${formatPrice(Number(supply.costPerUnit))})`} />
              )}
              <Input value={movRef} onChange={e => setMovRef(e.target.value)} placeholder="Referência (ex: NF 12345)" />
              <Input value={movReason} onChange={e => setMovReason(e.target.value)} placeholder="Motivo (opcional)" />
              <Button onClick={handleSubmitMov} disabled={saving} className="w-full bg-lilac-500 hover:bg-lilac-600">
                {saving ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
