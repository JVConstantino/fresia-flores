import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { adminProductService } from '@/services/adminProductService'
import { adminCategoryService } from '@/services/adminCategoryService'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function ProductList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showFeatured, setShowFeatured] = useState(false)
  const [showPromotion, setShowPromotion] = useState(false)
  const [priceMin, setPriceMin] = useState<number | null>(null)
  const [priceMax, setPriceMax] = useState<number | null>(null)
  const [stockFilter, setStockFilter] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  const loadCategories = async () => {
    try {
      const result = await adminCategoryService.getAll(1, 100)
      setCategories(Array.isArray(result) ? result : result.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar categorias')
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const result = await adminProductService.getAll(1, 100)
      setProducts(result.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (items: any[]) => {
    try {
      for (const item of items) {
        await adminProductService.delete(item.id)
      }
      toast.success(`${items.length} produto(s) deletado(s)`)
      loadProducts()
    } catch (err: any) {
      toast.error('Erro ao deletar produtos')
    }
  }

  const handleBulkStatus = async (items: any[], isActive: boolean) => {
    try {
      await Promise.all(items.map((item) => adminProductService.update(item.id, { isActive })))
      toast.success(`${items.length} produto(s) ${isActive ? 'ativado(s)' : 'inativado(s)'}`)
      loadProducts()
    } catch {
      toast.error('Erro ao atualizar status em lote')
    }
  }

  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false
    if (selectedStatus === 'active' && !p.isActive) return false
    if (selectedStatus === 'inactive' && p.isActive) return false
    if (showFeatured && !p.isFeatured) return false
    if (showPromotion && !p.salePrice) return false
    if (priceMin && p.price < priceMin) return false
    if (priceMax && p.price > priceMax) return false
    if (stockFilter === 'in_stock' && p.stock <= 0) return false
    if (stockFilter === 'out_of_stock' && p.stock > 0) return false
    if (stockFilter === 'low_stock' && p.stock >= 10) return false
    return true
  })

  const columns = [
    { key: 'name', label: 'Nome', sortable: true },
    {
      key: 'category',
      label: 'Categoria',
      sortable: true,
      render: (_: any, row: any) => row.categoryName || row.category?.name || 'N/A'
    },
    {
      key: 'price',
      label: 'Preço',
      sortable: true,
      render: (value: any) => `R$ ${parseFloat(value).toFixed(2)}`
    },
    { key: 'stock', label: 'Estoque', sortable: true },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => value ? '✓ Ativo' : '✗ Inativo'
    }
  ]

  const filters = [
    {
      label: 'Categoria',
      element: (
        <Select value={selectedCategory?.toString() || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : Number(v))}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
    {
      label: 'Status',
      element: (
        <Select value={selectedStatus || 'all'} onValueChange={(v) => setSelectedStatus(v === 'all' ? null : v)}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      label: 'Estoque',
      element: (
        <Select value={stockFilter || 'all'} onValueChange={(v) => setStockFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in_stock">Em estoque</SelectItem>
            <SelectItem value="out_of_stock">Fora de estoque</SelectItem>
            <SelectItem value="low_stock">Estoque baixo (&lt;10)</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      label: 'Preço Min',
      element: (
        <input
          type="number"
          placeholder="R$ 0"
          step="0.01"
          value={priceMin || ''}
          onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : null)}
          className="w-28 h-8 text-sm border border-ink-200 rounded px-2 focus:outline-none focus:ring-2 focus:ring-lilac-500"
        />
      )
    },
    {
      label: 'Preço Max',
      element: (
        <input
          type="number"
          placeholder="R$ 999"
          step="0.01"
          value={priceMax || ''}
          onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)}
          className="w-28 h-8 text-sm border border-ink-200 rounded px-2 focus:outline-none focus:ring-2 focus:ring-lilac-500"
        />
      )
    },
    {
      label: 'Destaque',
      element: (
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <Checkbox
            checked={showFeatured}
            onCheckedChange={(checked) => setShowFeatured(checked as boolean)}
          />
          Destaque
        </label>
      )
    },
    {
      label: 'Promoção',
      element: (
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <Checkbox
            checked={showPromotion}
            onCheckedChange={(checked) => setShowPromotion(checked as boolean)}
          />
          Em promoção
        </label>
      )
    }
  ]

  return (
    <AdminLayout
      title="Produtos"
      description="Gerenciar produtos da loja"
    >
      <DataTable
        data={filteredProducts}
        columns={columns}
        loading={loading}
        filters={filters}
        onNewClick={() => navigate('/admin/produtos/novo')}
        newLabel="Novo Produto"
        onEdit={(p: any) => navigate(`/admin/produtos/${p.id}`)}
        onDelete={handleDelete}
        bulkActions={[
          { label: 'Ativar selecionados', onClick: (items) => handleBulkStatus(items, true), variant: 'outline' },
          { label: 'Inativar selecionados', onClick: (items) => handleBulkStatus(items, false), variant: 'outline' },
        ]}
        searchPlaceholder="Buscar por nome..."
      />
    </AdminLayout>
  )
}
