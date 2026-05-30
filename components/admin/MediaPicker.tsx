'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Trash2, Check, Search, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { mediaService, type Media } from '@/services/mediaService'

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  multiple?: boolean
  onSelect: (urls: string[]) => void
  selectedUrls?: string[]
}

export function MediaPicker({ open, onClose, multiple = false, onSelect, selectedUrls = [] }: MediaPickerProps) {
  const [tab, setTab] = useState<'gallery' | 'upload'>('gallery')
  const [items, setItems] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedUrls))
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected(new Set(selectedUrls))
    loadMedia()
  }, [open])

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

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => loadMedia(), 300)
    return () => clearTimeout(t)
  }, [search])

  function toggleSelect(url: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        if (!multiple) next.clear()
        next.add(url)
      }
      return next
    })
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
      setTab('gallery')
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
      // Se estava selecionada, remover
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(media.url)
        return next
      })
      toast.success('Mídia removida')
    } catch {
      toast.error('Erro ao remover')
    }
  }

  function confirm_() {
    onSelect(Array.from(selected))
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
            <div className="flex items-center gap-3">
              <ImageIcon size={20} className="text-lilac-500" />
              <h2 className="text-lg font-semibold text-ink-800">Galeria de Mídia</h2>
              <span className="text-xs text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-ink-100">
            <button
              onClick={() => setTab('gallery')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'gallery' ? 'text-lilac-600 border-b-2 border-lilac-500' : 'text-ink-500 hover:text-ink-800'}`}
            >
              Galeria
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'upload' ? 'text-lilac-600 border-b-2 border-lilac-500' : 'text-ink-500 hover:text-ink-800'}`}
            >
              Upload
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'gallery' && (
              <>
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome..."
                    className="w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-12 text-ink-400">Carregando...</div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 text-ink-400">
                    <ImageIcon className="mx-auto mb-2 opacity-50" size={36} />
                    <p className="mb-4">Nenhuma mídia encontrada</p>
                    <button
                      onClick={() => setTab('upload')}
                      className="text-lilac-600 hover:underline text-sm"
                    >
                      Fazer upload da primeira imagem →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {items.map(media => {
                      const isSelected = selected.has(media.url)
                      return (
                        <div
                          key={media.id}
                          className={`relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all aspect-square ${isSelected ? 'border-lilac-500 ring-2 ring-lilac-300' : 'border-ink-100 hover:border-ink-300'}`}
                          onClick={() => toggleSelect(media.url)}
                        >
                          <img src={media.url} alt={media.alt || media.filename} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-lilac-500/30 flex items-center justify-center">
                              <div className="w-8 h-8 bg-lilac-500 text-white rounded-full flex items-center justify-center">
                                <Check size={16} />
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(media) }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                            title="Apagar"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                            <p className="text-[10px] text-white truncate">{media.filename}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {tab === 'upload' && (
              <div className="text-center py-12">
                <Upload size={48} className="mx-auto mb-4 text-lilac-400" />
                <p className="text-ink-600 mb-4">Selecione imagens para fazer upload</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg cursor-pointer transition-colors">
                  <Upload size={16} />
                  {uploading ? 'Enviando...' : 'Escolher Arquivos'}
                  <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
                </label>
                <p className="text-xs text-ink-400 mt-3">Múltiplos arquivos suportados · máx 5MB cada</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-ink-100">
            <p className="text-sm text-ink-500">
              {selected.size > 0 ? `${selected.size} selecionada(s)` : 'Nenhuma selecionada'}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-ink-600 border border-ink-200 rounded-lg hover:bg-ink-50">
                Cancelar
              </button>
              <button
                onClick={confirm_}
                disabled={selected.size === 0}
                className="px-6 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white text-sm font-semibold rounded-lg"
              >
                Selecionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
