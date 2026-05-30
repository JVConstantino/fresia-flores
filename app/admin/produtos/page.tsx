'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  salePrice?: number
  stock: number
  category: { name: string }
  images: string
  isFeatured: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      await api.delete(`/admin/products/${id}`)
      setProducts(products.filter(p => p.id !== id))
      toast.success('Produto excluído!')
    } catch {
      toast.error('Erro ao excluir produto')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 text-ink-500">Carregando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-ink-900">Produtos</h1>
        <Link href="/admin/produtos/novo">
          <Button className="bg-lilac-500 hover:bg-lilac-600 text-white">
            <Plus size={16} className="mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">
                  Produto
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">
                  Categoria
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">
                  Preço
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">
                  Estoque
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">
                  Destaque
                </th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-ink-100 hover:bg-ink-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center text-lg">
                        🌸
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-800">{product.name}</p>
                        <p className="text-xs text-ink-500">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink-600">{product.category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {product.salePrice ? (
                        <>
                          <span className="text-sm font-medium text-lilac-600">
                            R$ {Number(product.salePrice).toFixed(2)}
                          </span>
                          <span className="text-xs text-ink-400 line-through ml-2">
                            R$ {Number(product.price).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-ink-800">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${
                      product.stock <= 5 ? 'text-red-600' : 'text-ink-800'
                    }`}>
                      {product.stock} unidades
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.isFeatured && (
                      <span className="px-2 py-0.5 bg-lilac-100 text-lilac-700 text-xs rounded-full">
                        Destaque
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/loja/${product.slug}`}>
                        <Button variant="ghost" size="sm">
                          <Eye size={14} />
                        </Button>
                      </Link>
                      <Link href={`/admin/produtos/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
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
