import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { Image as ImageIcon } from 'lucide-react'
import { adminCategoryService } from '@/services/adminCategoryService'
import { toast } from 'sonner'

export function CategoryList() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [pickerOpen, setPickerOpen] = useState<'new' | 'edit' | null>(null)

  const loadCategories = async () => {
    try {
      setLoading(true)
      const result = await adminCategoryService.getAll(1, 100)
      setCategories(Array.isArray(result) ? result : result.data || [])
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Nome não pode ser vazio'); return }
    try {
      await adminCategoryService.create({ name: newName, imageUrl: newImageUrl || null })
      toast.success('Categoria criada')
      setNewName('')
      setNewImageUrl('')
      loadCategories()
    } catch {
      toast.error('Erro ao criar categoria')
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) { toast.error('Nome não pode ser vazio'); return }
    try {
      await adminCategoryService.update(id, { name: editName, imageUrl: editImageUrl || null })
      toast.success('Categoria atualizada')
      setEditingId(null)
      loadCategories()
    } catch {
      toast.error('Erro ao atualizar categoria')
    }
  }

  const handleDelete = async (items: any[]) => {
    try {
      for (const item of items) await adminCategoryService.delete(item.id)
      toast.success(`${items.length} categoria(s) deletada(s)`)
      loadCategories()
    } catch {
      toast.error('Erro ao deletar categoria(s)')
    }
  }

  const columns = [
    {
      key: 'imageUrl',
      label: 'Foto',
      render: (value: string) => value
        ? <img src={value} alt="" className="w-10 h-12 object-cover rounded-md" />
        : <div className="w-10 h-12 bg-ink-100 rounded-md flex items-center justify-center text-lg">🌸</div>
    },
    { key: 'name', label: 'Nome', sortable: true },
    {
      key: '_count',
      label: 'Produtos',
      sortable: true,
      render: (_: any, row: any) => row._count?.products ?? 0
    }
  ]

  return (
    <AdminLayout title="Categorias" description="Gerenciar categorias de produtos">
      <div className="space-y-4">
        <div className="bg-white border border-ink-200 rounded-lg p-4">
          <h3 className="font-semibold text-ink-800 mb-3 text-sm">Nova Categoria</h3>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Nome da categoria..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="flex-1 min-w-48"
            />
            <Button type="button" variant="outline" onClick={() => setPickerOpen('new')} className="gap-2">
              <ImageIcon size={14} />
              {newImageUrl ? 'Trocar imagem' : 'Selecionar imagem'}
            </Button>
            <Button onClick={handleCreate} className="bg-lilac-500 hover:bg-lilac-600 shrink-0">
              + Adicionar
            </Button>
          </div>
          {newImageUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img src={newImageUrl} alt="preview" className="w-12 h-16 object-cover rounded-lg border border-ink-200" />
              <button onClick={() => setNewImageUrl('')} className="text-xs text-red-500 hover:underline">Remover</button>
            </div>
          )}
        </div>

        <DataTable
          data={categories}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar categorias..."
          onEdit={(cat: any) => {
            setEditingId(cat.id)
            setEditName(cat.name)
            setEditImageUrl(cat.imageUrl || '')
          }}
          onDelete={handleDelete}
        />

        {editingId && (
          <div className="bg-white border border-lilac-200 rounded-lg p-4">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Editar Categoria</h3>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Nome..."
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 min-w-48"
              />
              <Button type="button" variant="outline" onClick={() => setPickerOpen('edit')} className="gap-2">
                <ImageIcon size={14} />
                {editImageUrl ? 'Trocar imagem' : 'Selecionar imagem'}
              </Button>
              <Button onClick={() => handleUpdate(editingId)} className="bg-lilac-500 hover:bg-lilac-600">Salvar</Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
            </div>
            {editImageUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img src={editImageUrl} alt="preview" className="w-12 h-16 object-cover rounded-lg border border-ink-200" />
                <button onClick={() => setEditImageUrl('')} className="text-xs text-red-500 hover:underline">Remover</button>
              </div>
            )}
          </div>
        )}
      </div>

      <MediaPicker
        open={pickerOpen !== null}
        onClose={() => setPickerOpen(null)}
        multiple={false}
        selectedUrls={pickerOpen === 'new' ? (newImageUrl ? [newImageUrl] : []) : (editImageUrl ? [editImageUrl] : [])}
        onSelect={(urls) => {
          if (pickerOpen === 'new') setNewImageUrl(urls[0] || '')
          else setEditImageUrl(urls[0] || '')
        }}
      />
    </AdminLayout>
  )
}
