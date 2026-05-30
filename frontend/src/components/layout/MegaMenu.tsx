import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { categoryService, type Category } from '@/services/categoryService'
import { productService, type ProductFeatured } from '@/services/productService'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(price))
}

function getFirstImage(images: any): string | null {
  try {
    if (!images) return null
    if (Array.isArray(images)) return images[0] ?? null
    if (typeof images === 'string') {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed[0] ?? null : null
    }
    return null
  } catch {
    return null
  }
}

export function MegaMenu() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Map<number, ProductFeatured[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const TRENDING_ID = -1

  useEffect(() => {
    categoryService.findAll().then((cats) => {
      const trending = { id: TRENDING_ID, name: '🔥 Mais buscados', slug: 'trending', _count: { products: 4 } }
      setCategories([trending, ...cats])
      setHoveredCategoryId(TRENDING_ID)
    })
  }, [])

  useEffect(() => {
    if (isOpen && hoveredCategoryId !== null && !categoryProducts.has(hoveredCategoryId)) {
      setLoading(true)
      const categoryIds = hoveredCategoryId === TRENDING_ID ? [] : [hoveredCategoryId]
      productService
        .findAll(categoryIds, 'newest', 4)
        .then((prods) => {
          const mapped = prods.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            images: p.images,
            category: p.category
          }))
          setCategoryProducts((prev) => new Map(prev).set(hoveredCategoryId, mapped))
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, hoveredCategoryId, categoryProducts])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const displayProducts = hoveredCategoryId ? categoryProducts.get(hoveredCategoryId) || [] : []

  return (
    <div className="relative" ref={menuRef} onMouseLeave={handleMouseLeave}>
      <button
        onMouseEnter={handleMouseEnter}
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 transition-colors py-1"
      >
        Categorias
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-ink-200 rounded-xl shadow-xl p-6 grid grid-cols-[260px_1fr] gap-8 z-50"
          style={{ width: 'min(1100px, 95vw)' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Coluna esquerda - Categorias */}
          <div className="border-r border-ink-100 pr-6">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 mb-3">
              Categorias
            </div>
            <button
              onClick={() => { navigate('/loja'); setIsOpen(false) }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors"
            >
              Todas as categorias
              <span className="text-[10px] text-lilac-500 bg-lilac-50 px-1.5 py-0.5 rounded-full">
                {categories.reduce((a, c) => a + c._count.products, 0)}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onMouseEnter={() => setHoveredCategoryId(cat.id)}
                onClick={() => { navigate(`/loja?categoria=${cat.slug}`); setIsOpen(false) }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  hoveredCategoryId === cat.id
                    ? 'bg-lilac-50 text-lilac-700 font-medium'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-800'
                }`}
              >
                {cat.name}
                <span className="text-[10px] text-lilac-500 bg-lilac-50 px-1.5 py-0.5 rounded-full">
                  {cat._count.products}
                </span>
              </button>
            ))}
          </div>

          {/* Coluna direita - Produtos */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 mb-3">
              Produtos em destaque
            </div>
            {loading ? (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg animate-pulse bg-ink-50 aspect-[3/4]" />
                ))}
              </div>
            ) : displayProducts.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {displayProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="bg-gradient-to-br from-lilac-100 to-petal-100 aspect-[3/4] overflow-hidden relative">
                      {getFirstImage(product.images) ? (
                        <img
                          src={getFirstImage(product.images)!}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                      )}
                      {/* Botão ver produto no hover */}
                      <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
                        <Link
                          to={`/produto/${product.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="bg-white text-ink-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-lilac-500 hover:text-white transition-colors"
                        >
                          Ver produto
                        </Link>
                      </div>
                    </div>
                    <div className="p-2 bg-white">
                      <div className="text-[11px] font-medium text-ink-800 leading-snug line-clamp-1 mb-0.5">
                        {product.name}
                      </div>
                      <div className="font-display italic text-xs text-lilac-500">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-ink-400 text-sm">
                Nenhum produto nesta categoria
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
