import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { contentService, type Banner, type TopBar, type Popup } from '@/services/appwrite/contentService'
import { toast } from 'sonner'

export function ContentPage() {
  const [tab, setTab] = useState<'banners' | 'topbar' | 'popups'>('banners')
  const [banners, setBanners] = useState<Banner[]>([])
  const [topbars, setTopbars] = useState<TopBar[]>([])
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [b, t, p] = await Promise.all([
        contentService.getAllBanners(),
        contentService.getAllTopBars(),
        contentService.getAllPopups(),
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

  const tabs = [
    { key: 'banners' as const, label: 'Banners', count: banners.length },
    { key: 'topbar' as const, label: 'Barra Topo', count: topbars.length },
    { key: 'popups' as const, label: 'Pop-ups', count: popups.length },
  ]

  return (
    <AdminLayout title="Conteúdo" description="Banners, barra de topo e pop-ups">
      <div className="p-6 space-y-6">
        <div className="flex gap-1 border-b border-ink-200 pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm px-4 py-2 rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'bg-lilac-50 text-lilac-600 font-medium border-b-2 border-lilac-500'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-ink-400">({t.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-500">Carregando...</div>
        ) : (
          <>
            {tab === 'banners' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1.5">
                    <Plus size={14} /> Novo Banner
                  </Button>
                </div>
                {banners.map(b => (
                  <Card key={b.$id} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
                      {b.image ? (
                        <img src={b.image} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ImageIcon size={18} className="text-ink-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm">{b.title}</div>
                      <div className="text-xs text-ink-500">Ordem: {b.order}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={b.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {b.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'topbar' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1.5">
                    <Plus size={14} /> Nova Barra
                  </Button>
                </div>
                {topbars.map(t => (
                  <Card key={t.$id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink-700">{t.text}</div>
                      {t.activeFrom && (
                        <div className="text-xs text-ink-400 mt-0.5">
                          {new Date(t.activeFrom).toLocaleDateString('pt-BR')} → {t.activeTo ? new Date(t.activeTo).toLocaleDateString('pt-BR') : 'Sem fim'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={t.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {t.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'popups' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1.5">
                    <Plus size={14} /> Novo Pop-up
                  </Button>
                </div>
                {popups.map(p => (
                  <Card key={p.$id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm">{p.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[10px] bg-ink-100 text-ink-500">{p.event}</Badge>
                        <span className="text-xs text-ink-400">{p.frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={p.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {p.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
