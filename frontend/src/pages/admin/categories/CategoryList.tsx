import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { Image as ImageIcon } from 'lucide-react'
import { adminCategoryService } from '@/services/adminCategoryService'
import { toast } from 'sonner'

interface CategoryModalProps {
  category: any | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

function CategoryModal({ category, open, onClose, onSaved }: CategoryModalProps) {
  const isEdit = Boolean(category)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(category?.name || '')
    setImageUrl(category?.imageUrl || '')
  }, [open, category])

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nome não pode ser vazio'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await adminCategoryService.update(category.id, { name, imageUrl: imageUrl || null })
        toast.success('Categoria atualizada')
      } else {
        await adminCategoryService.create({ name, imageUrl: imageUrl || null })
        toast.success('Categoria criada')
      }
      onSaved()
      onClose()
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar categoria' : 'Erro ao criar categoria')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Nome *</label>
            <Input
              placeholder="Nome da categoria..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Imagem</label>
            {imageUrl ? (
              <div className="flex items-center gap-3">
                <img src={imageUrl} alt="preview" className="w-12 h-16 object-cover rounded-lg border border-ink-200" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-2">
                    <ImageIcon size={14} /> Trocar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl('')}>Remover</Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setPickerOpen(true)} className="w-full gap-2">
                <ImageIcon size={14} /> Selecionar imagem
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>

        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          multiple={false}
          selectedUrls={imageUrl ? [imageUrl] : []}
          onSelect={(urls) => setImageUrl(urls[0] || '')}
        />
      </DialogContent>
    </Dialog>
  )
}

export function CategoryList() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; category: any | null }>({ open: false, category: null })

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
      <DataTable
        data={categories}
        columns={columns}
        loading={loading}
        searchPlaceholder="Buscar categorias..."
        onNewClick={() => setModal({ open: true, category: null })}
        newLabel="Nova Categoria"
        onEdit={(cat: any) => setModal({ open: true, category: cat })}
        onDelete={handleDelete}
      />

      <CategoryModal
        category={modal.category}
        open={modal.open}
        onClose={() => setModal({ open: false, category: null })}
        onSaved={loadCategories}
      />
    </AdminLayout>
  )
}
