import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { productService, type Product } from '@/services/productService'
import { categoryService, type Category } from '@/services/categoryService'
import { useLoaderEffect } from '@/hooks/useLoaderEffect'
import { Search, X } from 'lucide-react'

export function StorePage() {
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
  const [searchParams] = useSearchParams()

  useLoaderEffect(loading, 'Carregando produtos...')

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
    <Layout>
      <div className="w-full">
        {/* Banner de categoria */}
        {selectedCategory ? (
          <div className="h-40 sm:h-48 bg-gradient-to-r from-lilac-400 to-petal-400 flex items-end justify-start px-4 sm:px-7 py-7 sm:py-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl font-display font-semibold">{selectedCategory.name}</h1>
              <p className="text-white/80 text-sm mt-1">{selectedCategory._count.products} produtos</p>
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
                className="sm:ml-auto text-sm border border-ink-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
              >
                <option value="newest">Mais recentes</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </div>

            {/* Filtros: preço, destaque, promoção */}
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="number"
                placeholder="Preço mín"
                value={priceMin || ''}
                onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                className="w-32 text-sm"
              />
              <Input
                type="number"
                placeholder="Preço máx"
                value={priceMax || ''}
                onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                className="w-32 text-sm"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded"
                />
                Em destaque
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPromotion}
                  onChange={(e) => setHasPromotion(e.target.checked)}
                  className="rounded"
                />
                Com promoção
              </label>

              {/* Search */}
              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 border border-ink-200 rounded-md px-3 py-1.5 bg-white">
                <Search size={16} className="text-ink-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="outline-none text-sm w-full sm:w-40"
                />
              </div>
            </div>

            {/* Filtros ativos */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="flex items-center gap-1 bg-lilac-50 text-lilac-700 px-3 py-1 rounded-full text-sm hover:bg-lilac-100"
                  >
                    {filter.label}
                    <X size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid de produtos */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-ink-200 rounded-lg h-64 sm:h-80 animate-pulse" />
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-lg font-medium text-ink-800 mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm text-ink-500">Tente ajustar seus filtros.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    image={typeof product.images === 'string' ? JSON.parse(product.images)[0] : product.images?.[0]}
                    price={Number(product.price)}
                    category={product.category?.name || ''}
                    stock={product.stock}
                    onQuickView={() => setQuickViewProduct(product)}
                  />
                ))}
              </div>

              {displayCount < allProducts.length && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setDisplayCount(prev => prev + 8)}
                    className="bg-lilac-500 hover:bg-lilac-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    Ver mais {Math.min(8, allProducts.length - displayCount)} produtos
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </Layout>
  )
}
