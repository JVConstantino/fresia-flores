import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { neighborhoodService, type City, type Neighborhood } from '@/services/neighborhoodService'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export function AdminFretesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Record<number, Neighborhood[]>>({})
  const [expandedCity, setExpandedCity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [cityDialog, setCityDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; city?: City }>({ open: false, mode: 'create' })
  const [neighborDialog, setNeighborDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; cityId?: number; neighbor?: Neighborhood }>({ open: false, mode: 'create' })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'city' | 'neighborhood'; id: number; name: string } | null>(null)

  const [cityForm, setCityForm] = useState({ name: '', state: '' })
  const [neighborForm, setNeighborForm] = useState({ name: '', deliveryFee: '', isActive: true })

  useEffect(() => {
    neighborhoodService.getCities().then(data => { setCities(data); setLoading(false) })
  }, [])

  const loadNeighborhoods = async (cityId: number) => {
    if (neighborhoods[cityId]) return
    const data = await neighborhoodService.getAdminNeighborhoods(cityId)
    setNeighborhoods(prev => ({ ...prev, [cityId]: data }))
  }

  const toggleCity = (cityId: number) => {
    if (expandedCity === cityId) { setExpandedCity(null); return }
    setExpandedCity(cityId)
    loadNeighborhoods(cityId)
  }

  const handleSaveCity = async () => {
    try {
      if (cityDialog.mode === 'create') {
        const city = await neighborhoodService.createCity(cityForm.name, cityForm.state)
        setCities(prev => [...prev, city])
      } else if (cityDialog.city) {
        const updated = await neighborhoodService.updateCity(cityDialog.city.id, cityForm)
        setCities(prev => prev.map(c => c.id === cityDialog.city!.id ? { ...c, ...updated } : c))
      }
      setCityDialog({ open: false, mode: 'create' })
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Erro ao salvar cidade.')
    }
  }

  const handleSaveNeighbor = async () => {
    try {
      const fee = parseFloat(neighborForm.deliveryFee)
      if (neighborDialog.mode === 'create' && neighborDialog.cityId) {
        const n = await neighborhoodService.createNeighborhood(neighborDialog.cityId, neighborForm.name, fee)
        setNeighborhoods(prev => ({ ...prev, [neighborDialog.cityId!]: [...(prev[neighborDialog.cityId!] ?? []), n] }))
        setCities(prev => prev.map(c => c.id === neighborDialog.cityId ? { ...c, _count: { neighborhoods: c._count.neighborhoods + 1 } } : c))
      } else if (neighborDialog.neighbor) {
        const updated = await neighborhoodService.updateNeighborhood(neighborDialog.neighbor.id, { name: neighborForm.name, deliveryFee: fee, isActive: neighborForm.isActive })
        const cid = neighborDialog.neighbor.cityId
        setNeighborhoods(prev => ({ ...prev, [cid]: (prev[cid] ?? []).map(n => n.id === neighborDialog.neighbor!.id ? { ...n, ...updated } : n) }))
      }
      setNeighborDialog({ open: false, mode: 'create' })
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Erro ao salvar bairro.')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog) return
    try {
      if (deleteDialog.type === 'city') {
        await neighborhoodService.deleteCity(deleteDialog.id)
        setCities(prev => prev.filter(c => c.id !== deleteDialog.id))
      } else {
        const neighbor = Object.values(neighborhoods).flat().find(n => n.id === deleteDialog.id)
        await neighborhoodService.deleteNeighborhood(deleteDialog.id)
        if (neighbor) {
          setNeighborhoods(prev => ({ ...prev, [neighbor.cityId]: (prev[neighbor.cityId] ?? []).filter(n => n.id !== deleteDialog.id) }))
          setCities(prev => prev.map(c => c.id === neighbor.cityId ? { ...c, _count: { neighborhoods: c._count.neighborhoods - 1 } } : c))
        }
      }
      setDeleteDialog(null)
    } catch {
      alert('Erro ao excluir.')
    }
  }

  if (loading) return <AdminLayout title="Fretes" description="Gerenciar cidades e frete"><div className="p-8 text-ink-500">Carregando...</div></AdminLayout>

  return (
    <AdminLayout title="Fretes" description="Gerenciar cidades e frete">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display italic text-3xl text-ink-800">Cidades e Fretes</h1>
            <p className="text-sm text-ink-500 mt-1">{cities.length} cidade(s) cadastrada(s)</p>
          </div>
          <Button
            className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill"
            onClick={() => { setCityForm({ name: '', state: '' }); setCityDialog({ open: true, mode: 'create' }) }}
          >
            + Nova Cidade
          </Button>
        </div>

        <div className="space-y-3">
          {cities.map(city => (
            <div key={city.id} className="bg-white border border-ink-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-ink-50 transition-colors"
                onClick={() => toggleCity(city.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs transition-transform inline-block ${expandedCity === city.id ? 'rotate-90' : ''}`}>▶</span>
                  <span className="font-medium text-ink-800">{city.name}, {city.state}</span>
                  <span className="text-xs text-lilac-500 bg-lilac-50 px-2 py-0.5 rounded-pill">
                    {city._count.neighborhoods} bairros
                  </span>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setCityForm({ name: city.name, state: city.state }); setCityDialog({ open: true, mode: 'edit', city }) }}>Editar</Button>
                  <Button variant="outline" size="sm" className="text-xs text-red-400 border-red-100 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, type: 'city', id: city.id, name: city.name })}>Excluir</Button>
                </div>
              </div>

              {expandedCity === city.id && (
                <div className="border-t border-ink-100 px-5 py-4">
                  <div className="flex justify-end mb-3">
                    <Button size="sm" className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill text-xs" onClick={() => { setNeighborForm({ name: '', deliveryFee: '', isActive: true }); setNeighborDialog({ open: true, mode: 'create', cityId: city.id }) }}>
                      + Novo Bairro
                    </Button>
                  </div>
                  {!neighborhoods[city.id] ? (
                    <p className="text-sm text-ink-500">Carregando...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bairro</TableHead>
                          <TableHead>Frete</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {neighborhoods[city.id].map(n => (
                          <TableRow key={n.id}>
                            <TableCell className="text-sm">{n.name}</TableCell>
                            <TableCell className="text-sm font-medium">{formatPrice(Number(n.deliveryFee))}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-pill ${n.isActive ? 'bg-leaf-500/10 text-leaf-500' : 'bg-ink-100 text-ink-500'}`}>
                                {n.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button className="text-xs text-lilac-500 hover:text-lilac-600" onClick={() => { setNeighborForm({ name: n.name, deliveryFee: String(n.deliveryFee), isActive: n.isActive }); setNeighborDialog({ open: true, mode: 'edit', neighbor: n }) }}>Editar</button>
                                <span className="text-ink-200">|</span>
                                <button className="text-xs text-red-400 hover:text-red-500" onClick={() => setDeleteDialog({ open: true, type: 'neighborhood', id: n.id, name: n.name })}>Excluir</button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog cidade */}
      <Dialog open={cityDialog.open} onOpenChange={open => !open && setCityDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{cityDialog.mode === 'create' ? 'Nova Cidade' : 'Editar Cidade'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Nome</label><Input value={cityForm.name} onChange={e => setCityForm(p => ({ ...p, name: e.target.value }))} placeholder="Nova Friburgo" /></div>
            <div><label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Estado</label><Input value={cityForm.state} onChange={e => setCityForm(p => ({ ...p, state: e.target.value }))} placeholder="RJ" maxLength={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialog(p => ({ ...p, open: false }))}>Cancelar</Button>
            <Button className="bg-ink-800 text-white" onClick={handleSaveCity}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog bairro */}
      <Dialog open={neighborDialog.open} onOpenChange={open => !open && setNeighborDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{neighborDialog.mode === 'create' ? 'Novo Bairro' : 'Editar Bairro'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Nome</label><Input value={neighborForm.name} onChange={e => setNeighborForm(p => ({ ...p, name: e.target.value }))} placeholder="CENTRO" /></div>
            <div><label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Frete (R$)</label><Input type="number" step="0.01" value={neighborForm.deliveryFee} onChange={e => setNeighborForm(p => ({ ...p, deliveryFee: e.target.value }))} placeholder="11.00" /></div>
            {neighborDialog.mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={neighborForm.isActive} onChange={e => setNeighborForm(p => ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="isActive" className="text-sm text-ink-600">Ativo</label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeighborDialog(p => ({ ...p, open: false }))}>Cancelar</Button>
            <Button className="bg-ink-800 text-white" onClick={handleSaveNeighbor}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog excluir */}
      <Dialog open={!!deleteDialog} onOpenChange={open => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar exclusao</DialogTitle></DialogHeader>
          <p className="text-sm text-ink-600 py-2">Excluir <strong>{deleteDialog?.name}</strong>? Esta acao nao pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
