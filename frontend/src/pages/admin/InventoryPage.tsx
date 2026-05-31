import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { adminProductService } from '@/services/adminProductService'
import { toast } from 'sonner'

interface InventoryProduct {
  id: number
  name: string
  stock: number
  categoryName?: string
  isActive: boolean
}

export function InventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [minQty, setMinQty] = useState('')
  const [maxQty, setMaxQty] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await adminProductService.getAll(1, 500)
      setProducts(result.data || [])
    } catch {
      toast.error('Erro ao carregar estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const lowStockCount = products.filter((p) => Number(p.stock) <= 5).length
  const categories = Array.from(new Set(products.map((p) => p.categoryName || 'Sem categoria'))).sort()

  const filteredProducts = products.filter((p) => {
    const productName = p.name.toLowerCase()
    const matchSearch = search.trim() === '' || productName.includes(search.toLowerCase())
    const productCategory = p.categoryName || 'Sem categoria'
    const matchCategory = category === 'all' || productCategory === category
    const isLow = Number(p.stock) <= 5
    const matchStock = stockFilter === 'all' || (stockFilter === 'low' ? isLow : !isLow)
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? p.isActive : !p.isActive)

    const qty = Number(p.stock)
    const min = minQty.trim() === '' ? null : Number(minQty)
    const max = maxQty.trim() === '' ? null : Number(maxQty)
    const matchMin = min === null || qty >= min
    const matchMax = max === null || qty <= max

    return matchSearch && matchCategory && matchStock && matchStatus && matchMin && matchMax
  })

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredProducts.some((p) => p.id === id)))
      return
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredProducts.map((p) => p.id)])))
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleBulkStatus(isActive: boolean) {
    if (selectedIds.length === 0) {
      toast.error('Selecione ao menos um produto')
      return
    }

    setBulkLoading(true)
    try {
      await Promise.all(selectedIds.map((id) => adminProductService.update(id, { isActive })))
      toast.success(`${selectedIds.length} produto(s) atualizado(s)`)
      setSelectedIds([])
      await load()
    } catch {
      toast.error('Erro ao aplicar ação em lote')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <AdminLayout title="Estoque" description={`${products.length} produtos cadastrados (${lowStockCount} com estoque baixo)`}>
      <div className="p-3 sm:p-6 space-y-6 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto"
              className="w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'ok')}
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
          >
            <option value="all">Todo estoque</option>
            <option value="low">{'Estoque baixo (<= 5)'}</option>
            <option value="ok">{'Estoque ok (> 5)'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
          >
            <option value="all">Todos status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <div className="grid grid-cols-2 gap-2 lg:col-span-2 min-w-0">
            <input
              type="number"
              min={0}
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              placeholder="Qtd min"
              className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
            />
            <input
              type="number"
              min={0}
              value={maxQty}
              onChange={(e) => setMaxQty(e.target.value)}
              placeholder="Qtd max"
              className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-500">{filteredProducts.length} item(ns) filtrado(s) - {selectedIds.length} selecionado(s)</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus(true)}
              disabled={bulkLoading || selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-leaf-300 text-leaf-700 hover:bg-leaf-50 disabled:opacity-50"
            >
              Ativar selecionados
            </button>
            <button
              onClick={() => handleBulkStatus(false)}
              disabled={bulkLoading || selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-ink-300 text-ink-700 hover:bg-ink-50 disabled:opacity-50"
            >
              Inativar selecionados
            </button>
            <button
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-50"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-500">Carregando...</div>
        ) : (
        <div className="bg-white rounded-xl border border-ink-200 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50">
                  <th className="text-center px-3 py-3">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider">Produto</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider hidden md:table-cell">Categoria</th>
                  <th className="text-center px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider">Estoque</th>
                  <th className="text-center px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider">Alerta</th>
                  <th className="text-center px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filteredProducts.map((p) => {
                  const isLow = Number(p.stock) <= 5
                  return (
                    <tr key={p.id} className="hover:bg-ink-50 transition-colors">
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelectOne(p.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-800">{p.name}</td>
                      <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{p.categoryName || 'Sem categoria'}</td>
                      <td className="px-4 py-3 text-center text-ink-800 font-semibold">{Number(p.stock)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={isLow ? 'bg-red-100 text-red-700' : 'bg-leaf-100 text-leaf-700'}>
                          {isLow ? 'Baixo' : 'OK'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={p.isActive ? 'bg-lilac-100 text-lilac-700' : 'bg-ink-100 text-ink-700'}>
                          {p.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-ink-400">
                      Nenhum produto encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
