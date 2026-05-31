import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { adminPostService } from '@/services/postService'

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function PostForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!id) return
    adminPostService.get(Number(id)).then(p => {
      setTitle(p.title)
      setSlug(p.slug)
      setExcerpt(p.excerpt || '')
      setBody(p.body)
      setCoverUrl(p.coverUrl || '')
      setIsPublished(p.isPublished)
      setSlugTouched(true)
    }).catch(() => toast.error('Erro ao carregar post'))
  }, [id])

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title))
  }, [title])

  async function handleSave() {
    if (!title.trim() || !body.trim()) {
      toast.error('Título e conteúdo são obrigatórios')
      return
    }
    setSaving(true)
    try {
      const data = { title, slug, excerpt, body, coverUrl: coverUrl || null, isPublished }
      if (isEdit) await adminPostService.update(Number(id), data)
      else await adminPostService.create(data)
      toast.success(isEdit ? 'Post atualizado' : 'Post criado')
      navigate('/admin/blog')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title={isEdit ? 'Editar Post' : 'Novo Post'} description="Editor de posts do blog">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/blog')} className="gap-2">
          <ArrowLeft size={14} /> Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Título</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do post" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Slug (URL)</label>
            <Input value={slug} onChange={e => { setSlug(e.target.value); setSlugTouched(true) }} placeholder="meu-post" />
            <p className="text-xs text-ink-400 mt-1">/blog/{slug || 'slug'}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Resumo</label>
            <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Breve descrição..." rows={3} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Conteúdo</label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink-800">Publicação</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-lilac-500" />
              <span>Publicar agora</span>
            </label>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-lilac-500 hover:bg-lilac-600">
              {saving ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Criar post')}
            </Button>
          </div>

          <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink-800">Imagem de capa</h3>
            {coverUrl ? (
              <div>
                <img src={coverUrl} className="w-full aspect-[3/2] object-cover rounded-lg mb-2" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="flex-1">Trocar</Button>
                  <Button variant="outline" size="sm" onClick={() => setCoverUrl('')} className="flex-1">Remover</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setPickerOpen(true)} className="w-full gap-2">
                <ImageIcon size={14} /> Escolher capa
              </Button>
            )}
          </div>
        </aside>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple={false}
        selectedUrls={coverUrl ? [coverUrl] : []}
        onSelect={urls => setCoverUrl(urls[0] || '')}
      />
    </AdminLayout>
  )
}
