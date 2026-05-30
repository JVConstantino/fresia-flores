'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { productService, type Product } from '@/services/productService'
import { categoryService, type Category } from '@/services/categoryService'
import { Search, X } from 'lucide-react'

export default function StorePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [sortOption, setSortOption] = useState('newest')
  const [priceMin, setPriceMin] = useState<number>()
  const [priceMax, setPriceMax] = useState<number>()
  const [isFeatured, setIsFeatured] = useState(false)
  const [hasPromotion, setHasPromotion] = useState(false)
  const [search, setSearch] = useState('')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(8)
  const searchParams = useSearchParams()

  useEffect(() => {
    categoryService.findAll().then(setCategories)
  }, [])

  useEffect(() => {
    const slug = searchParams.get('categoria')
    const categoryId = slug ? categories.find(c => c.slug === slug)?.id : undefined
    if (categoryId) setSelectedCategories([categoryId])

    const minPrice = searchParams.get('preco_min')
    if (minPrice) setPriceMin(Number(minPrice))

    const maxPrice = searchParams.get('preco_max')
    if (maxPrice) setPriceMax(Number(maxPrice))

    const featured = searchParams.get('destaque')
    if (featured) setIsFeatured(true)

    const promo = searchParams.get('promocao')
    if (promo) setHasPromotion(true)

    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams, categories])

  useEffect(() => {
    setLoading(true)
    productService
      .findAll(
        selectedCategories.length > 0 ? selectedCategories : undefined,
        sortOption,
        undefined,
        undefined,
        priceMin,
        priceMax,
        isFeatured ? true : undefined,
        hasPromotion ? true : undefined,
        search || undefined
      )
      .then((data) => {
        setAllProducts(data)
      })
      .finally(() => setLoading(false))
  }, [selectedCategories, sortOption, priceMin, priceMax, isFeatured, hasPromotion, search])

  const displayedProducts = useMemo(() => {
    return allProducts.slice(0, displayCount)
  }, [allProducts, displayCount])

  const activeFilters = useMemo(() => {
    const filters = []
    if (selectedCategories.length > 0) {
      selectedCategories.forEach((id) => {
        const cat = categories.find(c => c.id === id)
        if (cat) filters.push({ label: `Categoria: ${cat.name}`, id: `cat-${id}` })
      })
    }
    if (priceMin !== undefined) filters.push({ label: `Preço mín: R$ ${priceMin.toFixed(2)}`, id: 'price-min' })
    if (priceMax !== undefined) filters.push({ label: `Preço máx: R$ ${priceMax.toFixed(2)}`, id: 'price-max' })
    if (isFeatured) filters.push({ label: 'Em destaque', id: 'featured' })
    if (hasPromotion) filters.push({ label: 'Com promoção', id: 'promotion' })
    return filters
  }, [selectedCategories, priceMin, priceMax, isFeatured, hasPromotion, categories])

  const handleRemoveFilter = (filterId: string) => {
    if (filterId.startsWith('cat-')) {
      const catId = Number(filterId.split('-')[1])
      setSelectedCategories(prev => prev.filter(id => id !== catId))
    } else if (filterId === 'price-min') {
      setPriceMin(undefined)
    } else if (filterId === 'price-max') {
      setPriceMax(undefined)
    } else if (filterId === 'featured') {
      setIsFeatured(false)
    } else if (filterId === 'promotion') {
      setHasPromotion(false)
    }
  }

  const selectedCategory = selectedCategories.length > 0
    ? categories.find(c => c.id === selectedCategories[0])
    : null

  return (
    <div className="w-full">
      {/* Banner de categoria */}
      {selectedCategory ? (
        <div className="h-40 sm:h-48 bg-gradient-to-r from-lilac-400 to-petal-400 flex items-end justify-start px-4 sm:px-7 py-7 sm:py-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-display font-semibold">{selectedCategory.name}</h1>
            <p className="text-white/80 text-sm mt-1">{selectedCategory._count?.products || 0} produtos</p>
          </div>
        </div>
      ) : (
        <div className="h-40 sm:h-48 bg-gradient-to-r from-lilac-500 to-petal-400 flex items-center justify-center text-white text-center px-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-semibold">Nossa Loja</h1>
            <p className="text-white/80 text-sm mt-1">Flores frescas, entregadas com carinho</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-7 py-8 sm:py-10">
        {/* Barra de filtros horizontal */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Categorias em chips */}
            <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 sm:flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (selectedCategories.includes(cat.id)) {
                      setSelectedCategories(prev => prev.filter(id => id !== cat.id))
                    } else {
                      setSelectedCategories([cat.id])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-lilac-500 text-white'
                      : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Ordenação */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-1 rounded-lg border border-ink-200 text-sm text-ink-700 bg-white"
            >
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name_asc">A-Z</option>
              <option value="name_desc">Z-A</option>
            </select>

            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filtros ativos */}
          {activeFilters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {activeFilters.map((filter) => (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-lilac-100 text-lilac-700 rounded-full text-xs"
                >
                  {filter.label}
                  <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="hover:text-lilac-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  setSelectedCategories([])
                  setPriceMin(undefined)
                  setPriceMax(undefined)
                  setIsFeatured(false)
                  setHasPromotion(false)
                }}
                className="text-xs text-ink-500 hover:text-ink-700 underline"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </div>

        {/* Grid de produtos */}
        {loading ? (
          <div className="text-center py-12 text-ink-500">Carregando...</div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-500 mb-4">Nenhum produto encontrado</p>
            <Button
              onClick={() => {
                setSelectedCategories([])
                setPriceMin(undefined)
                setPriceMax(undefined)
                setIsFeatured(false)
                setHasPromotion(false)
                setSearch('')
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  image={product.images?.[0]}
                  price={product.salePrice || product.price}
                  originalPrice={product.salePrice ? product.price : undefined}
                  discountPercent={
                    product.salePrice
                      ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)
                      : undefined
                  }
                  category={product.category?.name || 'Flores'}
                  stock={product.stock}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              ))}
            </div>

            {/* Load more */}
            {displayCount < allProducts.length && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => setDisplayCount(prev => prev + 8)}
                  variant="outline"
                >
                  Carregar mais ({allProducts.length - displayCount} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  )
}
