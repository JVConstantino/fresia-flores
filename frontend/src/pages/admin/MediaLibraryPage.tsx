import { useState, useEffect } from 'react'
import { Upload, Trash2, Search, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { mediaService, type Media } from '@/services/mediaService'

export function MediaLibraryPage() {
  const [items, setItems] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadMedia()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadMedia(), 300)
    return () => clearTimeout(t)
  }, [search])

  async function loadMedia() {
    setLoading(true)
    try {
      const res = await mediaService.list({ pageSize: 100, search })
      setItems(res.items)
    } catch {
      toast.error('Erro ao carregar mídias')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await mediaService.upload(file)
      }
      toast.success(`${files.length} mídia(s) adicionada(s)`)
      await loadMedia()
    } catch {
      toast.error('Erro no upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(media: Media) {
    if (!confirm(`Apagar "${media.filename}"?`)) return
    try {
      await mediaService.delete(media.id)
      setItems(items.filter(i => i.id !== media.id))
      toast.success('Mídia removida')
    } catch {
      toast.error('Erro ao remover')
    }
  }

  async function handleSync() {
    try {
      const res = await mediaService.sync()
      toast.success(`${res.added} arquivo(s) sincronizado(s) de ${res.total}`)
      await loadMedia()
    } catch {
      toast.error('Erro ao sincronizar')
    }
  }

  return (
    <AdminLayout title="Galeria de Mídia" description="Gerencie imagens da loja">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handleSync}
            className="inline-flex items-center gap-2 px-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-600 hover:bg-ink-50"
            title="Importar arquivos já existentes no servidor"
          >
            <RefreshCw size={14} /> Sincronizar
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg cursor-pointer text-sm font-semibold">
            <Upload size={14} />
            {uploading ? 'Enviando...' : 'Upload'}
            <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        {loading ? (
          <div className="text-center py-16 text-ink-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-ink-400 bg-white rounded-lg">
            <ImageIcon className="mx-auto mb-3 opacity-50" size={48} />
            <p>Nenhuma mídia ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {items.map(media => (
              <div key={media.id} className="group relative aspect-square rounded-lg overflow-hidden border border-ink-200 bg-white">
                <img src={media.url} alt={media.alt || media.filename} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(media)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                  <p className="text-[10px] text-white truncate">{media.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
