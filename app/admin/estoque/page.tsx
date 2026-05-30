'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, AlertCircle, Package } from 'lucide-react'

interface Product {
  id: number
  name: string
  stock: number
  category: { name: string }
  variants?: Array<{ id: number; name: string; stock: number }>
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const res = await api.get('/admin/products')
      setProducts(res.data)
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStock(productId: number, newStock: number) {
    try {
      await api.patch(`/admin/products/${productId}`, { stock: newStock })
      setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p))
      toast.success('Estoque atualizado!')
    } catch {
      toast.error('Erro ao atualizar estoque')
    }
  }

  const filteredProducts = products
    .filter(p => {
      if (filter === 'low') return p.stock > 0 && p.stock <= 5
      if (filter === 'out') return p.stock === 0
      return true
    })
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  if (loading) {
    return <div className="text-center py-12 text-ink-500">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Estoque</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-lilac-500 hover:bg-lilac-600' : ''}
          >
            Todos ({products.length})
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            onClick={() => setFilter('low')}
            className={filter === 'low' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            <AlertCircle size={14} className="mr-1" />
            Baixo ({lowStockCount})
          </Button>
          <Button
            variant={filter === 'out' ? 'default' : 'outline'}
            onClick={() => setFilter('out')}
            className={filter === 'out' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            Esgotado ({outOfStockCount})
          </Button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Produto</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Categoria</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Estoque</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-ink-100 hover:bg-ink-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Package size={16} className="text-ink-400" />
                      <span className="text-sm font-medium text-ink-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink-600">{product.category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.stock === 0 ? 'bg-red-100 text-red-700' :
                      product.stock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.stock === 0 ? 'Esgotado' :
                       product.stock <= 5 ? 'Baixo' : 'OK'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {product.stock === 0 && (
                        <span className="text-xs text-red-500">Repor</span>
                      )}
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
