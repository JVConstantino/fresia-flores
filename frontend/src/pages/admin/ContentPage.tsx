import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Image as ImageIcon, Megaphone, LayoutPanelTop, MessageSquare, Link as LinkIcon, Calendar, ToggleLeft } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SectionCard } from '@/components/admin/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { adminContentService, type Banner, type TopBar, type Popup } from '@/services/adminContentService'
import { toast } from 'sonner'

// ─── Shared helpers ────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge className={`text-[10px] shrink-0 ${active ? 'bg-leaf-50 text-leaf-600 border-leaf-200' : 'bg-ink-100 text-ink-500 border-ink-200'}`}>
      {active ? 'Ativo' : 'Inativo'}
    </Badge>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 flex items-center gap-4">
          <Skeleton className="w-16 h-12 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-40 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ label, onNew }: { label: string; onNew: () => void }) {
  return (
    <div className="py-14 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center text-ink-400">
        <Plus size={20} />
      </div>
      <p className="text-sm text-ink-500">Nenhum item cadastrado ainda</p>
      <Button size="sm" onClick={onNew} className="bg-lilac-500 hover:bg-lilac-600 text-white gap-1.5">
        <Plus size={14} /> {label}
      </Button>
    </div>
  )
}

// ─── Banner Modal ───────────────────────────────────────────────────
function BannerModal({ banner, open, onClose, onSaved }: { banner?: Banner | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(banner)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', subtitle: '', image: '', ctaText: '', ctaLink: '', order: 0, isActive: true
  })

  useEffect(() => {
    if (banner) {
      setForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        ctaText: banner.ctaText || '',
        ctaLink: banner.ctaLink || '',
        order: banner.order ?? 0,
        isActive: banner.isActive ?? true,
      })
    } else {
      setForm({ title: '', subtitle: '', image: '', ctaText: '', ctaLink: '', order: 0, isActive: true })
    }
  }, [banner, open])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return }
    setSaving(true)
    try {
      if (isEdit && banner) {
        await adminContentService.updateBanner(banner.$id, form)
        toast.success('Banner atualizado')
      } else {
        await adminContentService.createBanner(form)
        toast.success('Banner criado')
      }
      onSaved(); onClose()
    } catch { toast.error('Erro ao salvar banner') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Promoção de Verão" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Texto secundário do banner" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagem</label>
            {form.image ? (
              <div className="relative w-full h-28 rounded-md overflow-hidden border border-ink-200 group">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, image: '' }))}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
              </div>
            ) : (
              <button type="button" onClick={() => setPickerOpen(true)} className="w-full h-24 border-2 border-dashed border-ink-300 rounded-md hover:border-lilac-400 hover:bg-lilac-50 transition-colors flex flex-col items-center justify-center gap-1 text-ink-400 hover:text-lilac-500">
                <ImageIcon size={20} />
                <span className="text-xs">Selecionar imagem</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Texto do botão</label>
              <Input value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} placeholder="Comprar agora" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link</label>
              <Input value={form.ctaLink} onChange={e => setForm(p => ({ ...p, ctaLink: e.target.value }))} placeholder="/loja" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <Input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} min={0} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: Boolean(v) }))} />
                <span className="text-sm font-medium">Ativo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar banner'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} multiple={false} selectedUrls={form.image ? [form.image] : []} onSelect={urls => { setForm(p => ({ ...p, image: urls[0] || '' })); setPickerOpen(false) }} />
    </Dialog>
  )
}

// ─── TopBar Modal ───────────────────────────────────────────────────
function TopBarModal({ topbar, open, onClose, onSaved }: { topbar?: TopBar | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(topbar)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ text: '', activeFrom: '', activeTo: '', isActive: true })

  useEffect(() => {
    if (topbar) {
      setForm({
        text: topbar.text || '',
        activeFrom: topbar.activeFrom ? topbar.activeFrom.slice(0, 10) : '',
        activeTo: topbar.activeTo ? topbar.activeTo.slice(0, 10) : '',
        isActive: topbar.isActive ?? true,
      })
    } else {
      setForm({ text: '', activeFrom: '', activeTo: '', isActive: true })
    }
  }, [topbar, open])

  const handleSave = async () => {
    if (!form.text.trim()) { toast.error('Texto é obrigatório'); return }
    setSaving(true)
    try {
      const payload = { ...form, activeFrom: form.activeFrom || undefined, activeTo: form.activeTo || undefined }
      if (isEdit && topbar) {
        await adminContentService.updateTopBar(topbar.$id, payload)
        toast.success('Barra atualizada')
      } else {
        await adminContentService.createTopBar(payload)
        toast.success('Barra criada')
      }
      onSaved(); onClose()
    } catch { toast.error('Erro ao salvar barra') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Barra de Topo' : 'Nova Barra de Topo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Texto *</label>
            <Input value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Ex: 🌸 Frete grátis acima de R$ 150 em toda a loja!" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Início</label>
              <Input type="date" value={form.activeFrom} onChange={e => setForm(p => ({ ...p, activeFrom: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fim</label>
              <Input type="date" value={form.activeTo} onChange={e => setForm(p => ({ ...p, activeTo: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: Boolean(v) }))} />
            <span className="text-sm font-medium">Ativa</span>
          </label>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar barra'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Popup Modal ────────────────────────────────────────────────────
function PopupModal({ popup, open, onClose, onSaved }: { popup?: Popup | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(popup)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', body: '', ctaText: '', ctaLink: '', image: '',
    event: 'onLoad', delay: 3, frequency: 'once', isActive: true
  })

  useEffect(() => {
    if (popup) {
      setForm({
        title: popup.title || '',
        body: popup.body || '',
        ctaText: popup.ctaText || '',
        ctaLink: popup.ctaLink || '',
        image: popup.image || '',
        event: popup.event || 'onLoad',
        delay: popup.delay ?? 3,
        frequency: popup.frequency || 'once',
        isActive: popup.isActive ?? true,
      })
    } else {
      setForm({ title: '', body: '', ctaText: '', ctaLink: '', image: '', event: 'onLoad', delay: 3, frequency: 'once', isActive: true })
    }
  }, [popup, open])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return }
    setSaving(true)
    try {
      if (isEdit && popup) {
        await adminContentService.updatePopup(popup.$id, form)
        toast.success('Pop-up atualizado')
      } else {
        await adminContentService.createPopup(form)
        toast.success('Pop-up criado')
      }
      onSaved(); onClose()
    } catch { toast.error('Erro ao salvar pop-up') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Pop-up' : 'Novo Pop-up'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Ganhe 10% na primeira compra" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Corpo</label>
            <Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Texto principal do pop-up..." rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagem</label>
            {form.image ? (
              <div className="relative w-full h-24 rounded-md overflow-hidden border border-ink-200 group">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm(p => ({ ...p, image: '' }))} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              </div>
            ) : (
              <button type="button" onClick={() => setPickerOpen(true)} className="w-full h-20 border-2 border-dashed border-ink-300 rounded-md hover:border-lilac-400 hover:bg-lilac-50 transition-colors flex flex-col items-center justify-center gap-1 text-ink-400 hover:text-lilac-500 text-xs">
                <ImageIcon size={16} /> Selecionar imagem
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Texto do botão</label>
              <Input value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} placeholder="Aproveitar" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link</label>
              <Input value={form.ctaLink} onChange={e => setForm(p => ({ ...p, ctaLink: e.target.value }))} placeholder="/loja" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Disparar em</label>
              <Select value={form.event} onValueChange={v => setForm(p => ({ ...p, event: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onLoad">Ao carregar</SelectItem>
                  <SelectItem value="onExit">Ao sair</SelectItem>
                  <SelectItem value="onScroll">Ao rolar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Delay (s)</label>
              <Input type="number" min={0} value={form.delay} onChange={e => setForm(p => ({ ...p, delay: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Frequência</label>
              <Select value={form.frequency} onValueChange={v => setForm(p => ({ ...p, frequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre</SelectItem>
                  <SelectItem value="once">Uma vez</SelectItem>
                  <SelectItem value="daily">Por dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: Boolean(v) }))} />
            <span className="text-sm font-medium">Ativo</span>
          </label>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar pop-up'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} multiple={false} selectedUrls={form.image ? [form.image] : []} onSelect={urls => { setForm(p => ({ ...p, image: urls[0] || '' })); setPickerOpen(false) }} />
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────
export function ContentPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [topbars, setTopbars] = useState<TopBar[]>([])
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)

  const [bannerModal, setBannerModal] = useState<{ open: boolean; item?: Banner | null }>({ open: false })
  const [topbarModal, setTopbarModal] = useState<{ open: boolean; item?: TopBar | null }>({ open: false })
  const [popupModal, setPopupModal] = useState<{ open: boolean; item?: Popup | null }>({ open: false })

  const load = async () => {
    setLoading(true)
    try {
      const [b, t, p] = await Promise.all([
        adminContentService.getBanners(),
        adminContentService.getTopBars(),
        adminContentService.getPopups(),
      ])
      setBanners(b)
      setTopbars(t)
      setPopups(p)
    } catch {
      toast.error('Erro ao carregar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Excluir este banner?')) return
    try {
      await adminContentService.deleteBanner(id)
      setBanners(prev => prev.filter(b => b.$id !== id))
      toast.success('Banner excluído')
    } catch { toast.error('Erro ao excluir') }
  }

  const handleDeleteTopBar = async (id: string) => {
    if (!window.confirm('Excluir esta barra?')) return
    try {
      await adminContentService.deleteTopBar(id)
      setTopbars(prev => prev.filter(t => t.$id !== id))
      toast.success('Barra excluída')
    } catch { toast.error('Erro ao excluir') }
  }

  const handleDeletePopup = async (id: string) => {
    if (!window.confirm('Excluir este pop-up?')) return
    try {
      await adminContentService.deletePopup(id)
      setPopups(prev => prev.filter(p => p.$id !== id))
      toast.success('Pop-up excluído')
    } catch { toast.error('Erro ao excluir') }
  }

  return (
    <AdminLayout title="Conteúdo" description="Banners, barra de topo e pop-ups da loja">
      <Tabs defaultValue="banners">
        <TabsList className="bg-ink-100 border border-ink-200 mb-4">
          <TabsTrigger value="banners" className="data-[state=active]:bg-white data-[state=active]:text-lilac-600 data-[state=active]:shadow-sm gap-1.5">
            <Megaphone size={13} /> Banners
            {banners.length > 0 && <span className="text-[10px] bg-lilac-100 text-lilac-600 rounded-full px-1.5 font-medium">{banners.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="topbar" className="data-[state=active]:bg-white data-[state=active]:text-lilac-600 data-[state=active]:shadow-sm gap-1.5">
            <LayoutPanelTop size={13} /> Barra Topo
            {topbars.length > 0 && <span className="text-[10px] bg-lilac-100 text-lilac-600 rounded-full px-1.5 font-medium">{topbars.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="popups" className="data-[state=active]:bg-white data-[state=active]:text-lilac-600 data-[state=active]:shadow-sm gap-1.5">
            <MessageSquare size={13} /> Pop-ups
            {popups.length > 0 && <span className="text-[10px] bg-lilac-100 text-lilac-600 rounded-full px-1.5 font-medium">{popups.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* BANNERS */}
        <TabsContent value="banners">
          <SectionCard
            title="Banners"
            icon={<Megaphone size={15} />}
            description="Slides exibidos na página inicial"
            actions={
              <Button size="sm" onClick={() => setBannerModal({ open: true })} className="gap-1.5 bg-lilac-500 hover:bg-lilac-600 text-white h-7 text-xs px-3">
                <Plus size={13} /> Novo
              </Button>
            }
          >
            {loading ? <ListSkeleton /> : banners.length === 0 ? (
              <EmptyState label="Novo Banner" onNew={() => setBannerModal({ open: true })} />
            ) : (
              <div className="space-y-2">
                {banners.map(b => (
                  <div key={b.$id} className="flex items-center gap-3 p-3 bg-ink-50 rounded-md border border-ink-100 hover:border-ink-200 transition-colors">
                    <div className="w-14 h-10 rounded bg-ink-200 shrink-0 overflow-hidden">
                      {b.image ? <img src={b.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={14} className="m-auto mt-3 text-ink-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{b.title}</p>
                      {b.subtitle && <p className="text-xs text-ink-400 truncate">{b.subtitle}</p>}
                    </div>
                    <span className="text-xs text-ink-400 shrink-0">#{b.order}</span>
                    <StatusBadge active={b.isActive} />
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-lilac-600" onClick={() => setBannerModal({ open: true, item: b })}><Pencil size={13} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDeleteBanner(b.$id)}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* TOPBAR */}
        <TabsContent value="topbar">
          <SectionCard
            title="Barra de Topo"
            icon={<LayoutPanelTop size={15} />}
            description="Faixa informativa no topo do site"
            actions={
              <Button size="sm" onClick={() => setTopbarModal({ open: true })} className="gap-1.5 bg-lilac-500 hover:bg-lilac-600 text-white h-7 text-xs px-3">
                <Plus size={13} /> Nova
              </Button>
            }
          >
            {loading ? <ListSkeleton /> : topbars.length === 0 ? (
              <EmptyState label="Nova Barra" onNew={() => setTopbarModal({ open: true })} />
            ) : (
              <div className="space-y-2">
                {topbars.map(t => (
                  <div key={t.$id} className="flex items-center gap-3 p-3 bg-ink-50 rounded-md border border-ink-100 hover:border-ink-200 transition-colors">
                    <ToggleLeft size={16} className={t.isActive ? 'text-leaf-500' : 'text-ink-300'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-700 truncate">{t.text}</p>
                      {(t.activeFrom || t.activeTo) && (
                        <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={10} />
                          {t.activeFrom ? new Date(t.activeFrom).toLocaleDateString('pt-BR') : '—'}
                          {' → '}
                          {t.activeTo ? new Date(t.activeTo).toLocaleDateString('pt-BR') : 'Sem fim'}
                        </p>
                      )}
                    </div>
                    <StatusBadge active={t.isActive} />
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-lilac-600" onClick={() => setTopbarModal({ open: true, item: t })}><Pencil size={13} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDeleteTopBar(t.$id)}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* POPUPS */}
        <TabsContent value="popups">
          <SectionCard
            title="Pop-ups"
            icon={<MessageSquare size={15} />}
            description="Janelas modais exibidas ao visitante"
            actions={
              <Button size="sm" onClick={() => setPopupModal({ open: true })} className="gap-1.5 bg-lilac-500 hover:bg-lilac-600 text-white h-7 text-xs px-3">
                <Plus size={13} /> Novo
              </Button>
            }
          >
            {loading ? <ListSkeleton /> : popups.length === 0 ? (
              <EmptyState label="Novo Pop-up" onNew={() => setPopupModal({ open: true })} />
            ) : (
              <div className="space-y-2">
                {popups.map(p => (
                  <div key={p.$id} className="flex items-center gap-3 p-3 bg-ink-50 rounded-md border border-ink-100 hover:border-ink-200 transition-colors">
                    <MessageSquare size={16} className="text-ink-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-[10px] bg-ink-100 text-ink-500 border-0">{p.event}</Badge>
                        {p.ctaLink && <span className="text-xs text-ink-400 flex items-center gap-0.5 truncate"><LinkIcon size={9} />{p.ctaLink}</span>}
                      </div>
                    </div>
                    <StatusBadge active={p.isActive} />
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-lilac-600" onClick={() => setPopupModal({ open: true, item: p })}><Pencil size={13} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDeletePopup(p.$id)}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <BannerModal
        open={bannerModal.open}
        banner={bannerModal.item}
        onClose={() => setBannerModal({ open: false })}
        onSaved={load}
      />
      <TopBarModal
        open={topbarModal.open}
        topbar={topbarModal.item}
        onClose={() => setTopbarModal({ open: false })}
        onSaved={load}
      />
      <PopupModal
        open={popupModal.open}
        popup={popupModal.item}
        onClose={() => setPopupModal({ open: false })}
        onSaved={load}
      />
    </AdminLayout>
  )
}
