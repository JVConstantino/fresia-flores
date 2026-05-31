import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { adminPostService, type Post } from '@/services/postService'

export function PostList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await adminPostService.list(1, 100)
      setItems(res.items)
    } catch {
      toast.error('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(p: Post) {
    if (!confirm(`Apagar "${p.title}"?`)) return
    try {
      await adminPostService.delete(p.id)
      setItems(items.filter(i => i.id !== p.id))
      toast.success('Post removido')
    } catch {
      toast.error('Erro ao remover')
    }
  }

  return (
    <AdminLayout title="Blog" description="Gerencie os posts do blog">
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate('/admin/blog/novo')} className="gap-2 bg-lilac-500 hover:bg-lilac-600">
          <Plus size={14} /> Novo Post
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-ink-200 rounded-xl p-12 text-center text-ink-400">
          Nenhum post ainda
        </div>
      ) : (
        <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Título</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500 hidden md:table-cell">Publicado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.coverUrl && <img src={p.coverUrl} alt="" className="w-10 h-12 object-cover rounded-md" />}
                      <div>
                        <p className="font-medium text-ink-800">{p.title}</p>
                        <p className="text-xs text-ink-400">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.isPublished ? (
                      <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Publicado</span>
                    ) : (
                      <span className="text-[11px] bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full font-semibold">Rascunho</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => navigate(`/admin/blog/${p.id}`)} className="p-2 text-ink-500 hover:text-lilac-600 hover:bg-lilac-50 rounded-md">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-2 text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
