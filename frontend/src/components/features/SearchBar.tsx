import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown, ArrowLeft } from 'lucide-react'

import { categoryService, type Category } from '@/services/categoryService'

interface SearchBarProps {
  open: boolean
  onClose: () => void
}

export function SearchBar({ open, onClose }: SearchBarProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [hasPromotion, setHasPromotion] = useState(false)

  useEffect(() => {
    categoryService.findAll().then(setCategories)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    } else {
      setQuery('')
      setShowAdvanced(false)
      setSelectedCategory('')
      setPriceMin('')
      setPriceMax('')
      setHasPromotion(false)
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.addEventListener('mousedown', handleClick)
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    if (selectedCategory) params.set('categoria', selectedCategory)
    if (priceMin) params.set('preco_min', priceMin)
    if (priceMax) params.set('preco_max', priceMax)
    if (hasPromotion) params.set('promocao', '1')
    navigate(`/loja?${params.toString()}`)
    onClose()
  }

  // Render both views conditionally. The mobile view is portalled to document.body to bypass layout restriction constraints
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const desktopSearch = (
    <div
      ref={containerRef}
      className={`hidden md:block transition-all duration-300 ease-out relative ${
        open ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      }`}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-white border border-ink-200 rounded-full px-3 gap-2 h-9 shadow-sm">
          <Search size={14} className="text-ink-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="flex-1 text-sm text-ink-800 placeholder:text-ink-400 bg-transparent outline-none min-w-0"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-ink-400 hover:text-ink-600 flex-shrink-0">
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className={`flex-shrink-0 transition-colors ${showAdvanced ? 'text-lilac-500' : 'text-ink-400 hover:text-ink-600'}`}
            title="Filtros avançados"
          >
            <ChevronDown size={13} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showAdvanced && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-ink-200 rounded-xl shadow-xl p-4 space-y-3 z-50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 font-body">Filtros avançados</p>
            <div>
              <label className="block text-xs text-ink-600 mb-1">Categoria</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-sm border border-ink-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
              >
                <option value="">Todas</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-ink-600 mb-1">Preço mín.</label>
                <input type="number" min="0" step="0.01" placeholder="R$ 0" value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="w-full text-sm border border-ink-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-600 mb-1">Preço máx.</label>
                <input type="number" min="0" step="0.01" placeholder="R$ 999" value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="w-full text-sm border border-ink-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasPromotion} onChange={e => setHasPromotion(e.target.checked)}
                className="rounded text-lilac-500"
              />
              <span className="text-xs text-ink-600">Somente em promoção</span>
            </label>
            <button type="submit"
              className="w-full bg-lilac-500 hover:bg-lilac-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors animate-fade-in"
            >
              Buscar
            </button>
          </div>
        )}
      </form>
    </div>
  )

  const mobileSearchOverlay = mounted && open && typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 bg-white z-50 p-6 flex flex-col overflow-y-auto md:hidden animate-fade-in">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-ink-50 flex items-center justify-center text-ink-600 flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 flex items-center bg-ink-50 border border-ink-200 rounded-full px-4 gap-2 h-11">
                <Search size={16} className="text-ink-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="flex-1 text-sm text-ink-800 placeholder:text-ink-400 bg-transparent outline-none min-w-0"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="text-ink-400 flex-shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Filtros avançados</p>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                >
                  <option value="">Todas</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1.5">Preço mínimo</label>
                  <input type="number" min="0" step="0.01" placeholder="R$ 0" value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1.5">Preço máximo</label>
                  <input type="number" min="0" step="0.01" placeholder="R$ 999" value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={hasPromotion} onChange={e => setHasPromotion(e.target.checked)}
                  className="rounded text-lilac-500 w-4 h-4"
                />
                <span className="text-xs text-ink-600">Somente itens em promoção</span>
              </label>
            </div>

            <div className="mt-8 flex-shrink-0">
              <button type="submit"
                className="w-full bg-lilac-500 hover:bg-lilac-600 text-white text-sm font-semibold py-3.5 rounded-full transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>,
        document.body
      )
    : null

  return (
    <>
      {desktopSearch}
      {mobileSearchOverlay}
    </>
  )
}
