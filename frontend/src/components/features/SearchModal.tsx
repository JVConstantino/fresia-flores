import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { categoryService, type Category } from '@/services/categoryService'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [hasPromotion, setHasPromotion] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    categoryService.findAll().then(setCategories)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.append('search', query)
    if (selectedCategory) params.append('categoria', selectedCategory)
    if (priceMin) params.append('preco_min', priceMin)
    if (priceMax) params.append('preco_max', priceMax)
    if (hasPromotion) params.append('promocao', '1')
    if (isFeatured) params.append('destaque', '1')
    navigate(`/loja?${params.toString()}`)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl transform transition-all duration-300">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display italic text-ink-800">Buscar produtos</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-ink-50 rounded-lg transition-colors"
              >
                <X size={20} className="text-ink-500" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-ink-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Digite o que procura..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 py-3 text-base"
              />
            </div>

            {/* Advanced filters toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-lilac-600 hover:text-lilac-700 font-medium"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
              Pesquisa Avançada
            </button>

            {/* Advanced filters */}
            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-ink-200">
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">
                    Categoria
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-800 mb-2">
                      Preço mínimo
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-800 mb-2">
                      Preço máximo
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 999"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={hasPromotion}
                      onCheckedChange={(checked) => setHasPromotion(checked as boolean)}
                    />
                    <span className="text-sm text-ink-700">Somente em promoção</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                    />
                    <span className="text-sm text-ink-700">Somente destaques</span>
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-ink-200">
              <Button
                type="submit"
                className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white"
              >
                Buscar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
