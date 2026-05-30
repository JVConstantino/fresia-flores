'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, FolderOpen } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  _count?: { products: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const res = await api.get('/admin/categories')
      setCategories(res.data)
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/admin/categories/${editingId}`, formData)
        toast.success('Categoria atualizada!')
      } else {
        await api.post('/admin/categories', formData)
        toast.success('Categoria criada!')
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ name: '', slug: '' })
      loadCategories()
    } catch {
      toast.error('Erro ao salvar categoria')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza? Produtos vinculados perderão a categoria.')) return
    try {
      await api.delete(`/admin/categories/${id}`)
      setCategories(categories.filter(c => c.id !== id))
      toast.success('Categoria excluída!')
    } catch {
      toast.error('Erro ao excluir categoria')
    }
  }

  function handleEdit(cat: Category) {
    setEditingId(cat.id)
    setFormData({ name: cat.name, slug: cat.slug })
    setShowForm(true)
  }

  if (loading) {
    return <div className="text-center py-12 text-ink-500">Carregando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-ink-900">Categorias</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', slug: '' }) }} className="bg-lilac-500 hover:bg-lilac-600 text-white">
          <Plus size={16} className="mr-2" />
          Nova Categoria
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-ink-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-ink-700 mb-1 block">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="Nome da categoria"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-ink-700 mb-1 block">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="slug-da-categoria"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="bg-lilac-500 hover:bg-lilac-600 text-white">
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-ink-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center">
                <FolderOpen size={24} className="text-lilac-500" />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                  <Edit size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{cat.name}</h3>
            <p className="text-sm text-ink-500">/{cat.slug}</p>
            <p className="text-xs text-ink-400 mt-2">{cat._count?.products || 0} produtos</p>
          </div>
        ))}
      </div>
    </div>
  )
}
