import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle, Boxes, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supplyService, type Supply, type SupplyCategory } from '@/services/supplyService'

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function SupplyList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Supply[]>([])
  const [categories, setCategories] = useState<SupplyCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showOnlyLow, setShowOnlyLow] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    unit: 'un',
    costPerUnit: '',
    currentStock: '',
    minStock: '',
    supplier: '',
    notes: '',
  })

  useEffect(() => { load() }, [showOnlyLow])
  useEffect(() => { supplyService.listCategories().then(setCategories) }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await supplyService.list({ search: search || undefined, lowStock: showOnlyLow })
      setItems(data)
    } catch {
      toast.error('Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleCreate() {
    if (!form.name || !form.categoryId || !form.unit) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    try {
      await supplyService.create({
        name: form.name,
        categoryId: Number(form.categoryId),
        unit: form.unit,
        costPerUnit: Number(form.costPerUnit) || 0,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
        supplier: form.supplier || null,
        notes: form.notes || null,
      })
      toast.success('Suprimento criado')
      setShowNew(false)
      setForm({ name: '', categoryId: '', unit: 'un', costPerUnit: '', currentStock: '', minStock: '', supplier: '', notes: '' })
      load()
    } catch {
      toast.error('Erro ao criar')
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    try {
      await supplyService.createCategory(newCatName)
      const cats = await supplyService.listCategories()
      setCategories(cats)
      setNewCatName('')
      toast.success('Categoria criada')
    } catch {
      toast.error('Erro ao criar categoria')
    }
  }

  const lowStockCount = items.filter(s => Number(s.currentStock) <= Number(s.minStock)).length

  return (
    <AdminLayout title="Suprimentos" description="Controle de insumos e custos operacionais">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="flex flex-wrap gap-3 items-center flex-1 min-w-64">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar suprimento..." className="pl-9" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={showOnlyLow} onChange={e => setShowOnlyLow(e.target.checked)} className="accent-lilac-500" />
            <span>Apenas baixo estoque</span>
            {lowStockCount > 0 && (
              <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">{lowStockCount}</span>
            )}
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCatForm(!showCatForm)}>Categorias</Button>
          <Button onClick={() => setShowNew(true)} className="bg-lilac-500 hover:bg-lilac-600 gap-2">
            <Plus size={14} /> Novo Suprimento
          </Button>
        </div>
      </div>

      {showCatForm && (
        <div className="bg-white border border-ink-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-ink-800 mb-3">Categorias de Suprimentos</h3>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Nova categoria (ex: Embalagens, Cartões)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
            />
            <Button onClick={handleCreateCategory} className="bg-lilac-500 hover:bg-lilac-600 shrink-0">Adicionar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c.id} className="text-sm bg-ink-50 border border-ink-200 px-3 py-1.5 rounded-full">
                {c.name} <span className="text-ink-400">({c._count?.supplies ?? 0})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {showNew && (
        <div className="bg-white border border-lilac-200 rounded-xl p-5 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-ink-800">Novo Suprimento</h3>
            <button onClick={() => setShowNew(false)} className="text-ink-400 hover:text-ink-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome (ex: Caixa kraft 20x20)" />
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
            >
              <option value="">Categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unidade (un, m, kg, rolo)" />
            <Input type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} placeholder="Custo por unidade (R$)" />
            <Input type="number" step="0.01" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} placeholder="Estoque inicial" />
            <Input type="number" step="0.01" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="Estoque mínimo" />
            <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Fornecedor (opcional)" />
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas (opcional)" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} className="bg-lilac-500 hover:bg-lilac-600">Salvar</Button>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-ink-200 rounded-xl p-16 text-center">
          <Boxes size={40} className="mx-auto mb-3 text-ink-300" />
          <p className="text-ink-400">Nenhum suprimento cadastrado</p>
        </div>
      ) : (
        <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500 hidden md:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Estoque</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500 hidden md:table-cell">Custo unit.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500 hidden lg:table-cell">Valor total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {items.map(s => {
                const isLow = Number(s.currentStock) <= Number(s.minStock)
                const totalValue = Number(s.currentStock) * Number(s.costPerUnit)
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/admin/suprimentos/${s.id}`)}
                    className="hover:bg-ink-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink-800">{s.name}</p>
                        {isLow && <AlertTriangle size={14} className="text-red-500" />}
                      </div>
                      {s.supplier && <p className="text-xs text-ink-400">{s.supplier}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{s.category?.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-ink-700'}`}>
                        {Number(s.currentStock).toFixed(2)} {s.unit}
                      </span>
                      <p className="text-[10px] text-ink-400">mín {Number(s.minStock).toFixed(2)}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-600 hidden md:table-cell">{formatPrice(Number(s.costPerUnit))}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-800 hidden lg:table-cell">{formatPrice(totalValue)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
