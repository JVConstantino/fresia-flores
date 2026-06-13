import { useEffect, useState } from 'react'
import { Image as ImageIcon, Send, BookOpen } from 'lucide-react'
import { SectionCard } from '@/components/admin/SectionCard'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

interface PostModalProps {
  postId: number | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function PostModal({ postId, open, onClose, onSaved }: PostModalProps) {
  const isEdit = postId !== null

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
    if (!open) return
    if (postId !== null) {
      adminPostService.get(postId).then(p => {
        setTitle(p.title)
        setSlug(p.slug)
        setExcerpt(p.excerpt || '')
        setBody(p.body)
        setCoverUrl(p.coverUrl || '')
        setIsPublished(p.isPublished)
        setSlugTouched(true)
      }).catch(() => toast.error('Erro ao carregar post'))
    } else {
      setTitle('')
      setSlug('')
      setExcerpt('')
      setBody('')
      setCoverUrl('')
      setIsPublished(false)
      setSlugTouched(false)
    }
  }, [open, postId])

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
      if (isEdit) await adminPostService.update(postId!, data)
      else await adminPostService.create(data)
      toast.success(isEdit ? 'Post atualizado' : 'Post criado')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Post' : 'Novo Post'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 pt-2">
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
            <SectionCard title="Publicação" icon={<Send size={14} />} bodyClassName="space-y-3" className="border border-ink-100">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-lilac-500" />
                <span>Publicar agora</span>
              </label>
            </SectionCard>

            <SectionCard title="Imagem de capa" icon={<BookOpen size={14} />} bodyClassName="space-y-3" className="border border-ink-100">
              {coverUrl ? (
                <div>
                  <img src={coverUrl} className="w-full aspect-[3/2] object-cover rounded-md mb-2" />
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
            </SectionCard>
          </aside>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar post'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>

        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          multiple={false}
          selectedUrls={coverUrl ? [coverUrl] : []}
          onSelect={urls => setCoverUrl(urls[0] || '')}
        />
      </DialogContent>
    </Dialog>
  )
}
