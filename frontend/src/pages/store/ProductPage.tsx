import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { GalleryUnified } from '@/components/features/GalleryUnified'
import { productService, type Product } from '@/services/productService'
import { useLoaderEffect } from '@/hooks/useLoaderEffect'
import { useCartStore } from '@/store/cartStore'

type Tab = 'descricao' | 'cuidados' | 'entrega'

function parseImages(raw: any): string[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : []
  } catch { return [] }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

const STATIC_TABS = {
  cuidados:
    'Mantenha em local fresco, troque a água a cada 2 dias e corte os caules em diagonal para maior durabilidade. Evite exposição direta ao sol e fontes de calor.',
  entrega:
    'Entregamos de segunda a sábado. Pedidos feitos até as 14h são entregues no mesmo dia. Consulte disponibilidade para sua região durante o checkout.',
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0)
  const thumbRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [activeTab, setActiveTab] = useState<Tab>('descricao')
  const [message, setMessage] = useState('')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useLoaderEffect(loading, 'Carregando produto...')
  const { addItem } = useCartStore()

  useEffect(() => {
    if (!slug) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    setLoading(true)
    setNotFound(false)
    setGalleryActiveIndex(0)
    productService
      .findBySlug(slug)
      .then(p => {
        setProduct(p)
        setSelectedVariantId(p.variants[0]?.id ?? null)
        return productService.findAll([p.category.id], 'newest', 4, slug)
      })
      .then(setRelated)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Build unified image array: main product + all variants
  const buildUnifiedImages = (): { src: string; variantId: number | null }[] => {
    if (!product) return []
    const images: { src: string; variantId: number | null }[] = []

    // Add main product images
    const productImages = parseImages(product.images)
    productImages.forEach(src => {
      images.push({ src, variantId: null })
    })

    // Add variant images
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.images) {
          try {
            const variantImages = parseImages(variant.images)
            variantImages.forEach((src: string) => {
              images.push({ src, variantId: variant.id })
            })
          } catch {
            // Skip if images parsing fails
          }
        }
      })
    }

    return images
  }

  const unifiedImages = buildUnifiedImages()

  // Derivações
  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId)


  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="animate-pulse bg-ink-100 rounded-lg aspect-[4/5]" />
            <div className="space-y-4 pt-4">
              <div className="animate-pulse bg-ink-100 rounded h-5 w-20" />
              <div className="animate-pulse bg-ink-100 rounded h-10 w-3/4" />
              <div className="animate-pulse bg-ink-100 rounded h-24 w-full" />
              <div className="animate-pulse bg-ink-100 rounded h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (notFound || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-16 sm:py-24 text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="font-display italic text-3xl text-ink-800 mb-2">
            Produto não encontrado
          </h1>
          <p className="text-ink-500 mb-6">Este produto não existe ou foi removido.</p>
          <a href="/loja" className="text-sm text-lilac-500 hover:text-lilac-600 underline">
            Voltar à loja
          </a>
        </div>
      </Layout>
    )
  }

  // Dados de preço (product é garantido não-nulo aqui)
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price)
  const displaySalePrice = selectedVariant
    ? (selectedVariant.salePrice ? Number(selectedVariant.salePrice) : null)
    : ((product as any).salePrice ? Number((product as any).salePrice) : null)

  const selectVariant = (variantId: number) => {
    setSelectedVariantId(variantId)

    // Find first image index of this variant in unified array
    const firstImageIndex = unifiedImages.findIndex(
      img => img.variantId === variantId
    )
    if (firstImageIndex >= 0) {
      setGalleryActiveIndex(firstImageIndex)
    }

    // Scroll o strip horizontal até o thumbnail da variante selecionada
    setTimeout(() => {
      const el = thumbRefs.current.get(`v-${variantId}`)
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }, 0)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ink-500 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap">
          <a href="/" className="hover:text-ink-800 transition-colors">Início</a>
          <span>/</span>
          <a href="/loja" className="hover:text-ink-800 transition-colors">Loja</a>
          <span>/</span>
          <a
            href={`/loja?categoria=${product.category.slug}`}
            className="hover:text-ink-800 transition-colors"
          >
            {product.category.name}
          </a>
          <span>/</span>
          <span className="text-ink-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Área principal */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 mb-14 sm:mb-20">
          {/* Galeria unificada */}
          <GalleryUnified
            images={unifiedImages}
            activeIndex={galleryActiveIndex}
            onIndexChange={setGalleryActiveIndex}
          />

          {/* Info */}
          <div>
            <Badge
              variant="outline"
              className="text-lilac-500 border-lilac-200 text-[10px] mb-4 cursor-pointer hover:bg-lilac-50"
              onClick={() => (window.location.href = `/loja?categoria=${product.category.slug}`)}
            >
              {product.category.name}
            </Badge>

            <h1 className="font-display italic text-3xl sm:text-4xl text-ink-800 leading-tight mb-4">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-sm text-ink-500 leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Variantes */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-3">
                  Opções disponíveis
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(variant => {
                    const vPrice = Number(variant.price)
                    const vSalePrice = variant.salePrice ? Number(variant.salePrice) : null
                    const isActive = selectedVariantId === variant.id
                    return (
                      <button
                        key={variant.id}
                        onClick={() => selectVariant(variant.id)}
                          className={`flex flex-col items-start px-2.5 sm:px-3 py-2 text-left rounded-lg border transition-all max-w-full ${
                          isActive
                            ? 'border-ink-800 bg-ink-50 ring-1 ring-ink-800'
                            : 'border-ink-200 hover:border-lilac-400'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${isActive ? 'text-ink-800' : 'text-ink-600'} line-clamp-1`}>
                          {variant.name}
                        </span>
                        {variant.description && (
                          <span className="text-[10px] text-ink-400 mt-0.5">{variant.description}</span>
                        )}
                        <span className="text-xs mt-1 font-display italic text-lilac-600">
                          {vSalePrice ? (
                            <>
                              <span className="line-through text-ink-400 mr-1">{formatPrice(vPrice)}</span>
                              {formatPrice(vSalePrice)}
                            </>
                          ) : formatPrice(vPrice)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Preço */}
            <div className="mb-6">
              {displaySalePrice ? (
                <div className="flex items-baseline gap-3">
                  <span className="font-display italic text-xl sm:text-2xl text-ink-400 line-through">{formatPrice(displayPrice)}</span>
                  <span className="font-display italic text-3xl sm:text-4xl text-petal-500">{formatPrice(displaySalePrice)}</span>
                </div>
              ) : (
                <div className="font-display italic text-3xl sm:text-4xl text-ink-800">{formatPrice(displayPrice)}</div>
              )}
            </div>

            {/* Mensagem para o cartão */}
            <div className="mb-6">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
                Mensagem para o cartão{' '}
                <span className="normal-case font-normal">(opcional)</span>
              </div>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 120))}
                placeholder="Ex: Feliz aniversário, com carinho..."
                className="text-sm resize-none h-20"
              />
              <div className="text-[10px] text-ink-500 text-right mt-1">
                {message.length}/120
              </div>
            </div>

            {/* Badges de entrega */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { icon: '🚚', label: 'Entrega em até 24h' },
                { icon: '🏪', label: 'Retirada disponível' },
                { icon: '🌿', label: 'Flores frescas garantidas' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-ink-600 border border-ink-200 rounded-pill px-3 py-1.5"
                >
                  {icon} {label}
                </span>
              ))}
            </div>

            {/* Botão */}
            <Button
              className="bg-ink-800 hover:bg-lilac-500 text-white w-full py-3 rounded-pill text-sm font-semibold transition-colors"
              onClick={() =>
                addItem({
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  categoryName: product.category.name,
                  variantId: selectedVariant?.id ?? null,
                  variantName: selectedVariant?.name ?? null,
                  price: displayPrice,
                  productImages: unifiedImages[galleryActiveIndex]?.src ?? unifiedImages[0]?.src,
                })
              }
            >
              Adicionar ao carrinho
            </Button>
          </div>
        </div>

        {/* Abas de detalhes */}
        <div className="max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="flex border-b border-ink-200 mb-6 overflow-x-auto whitespace-nowrap">
            {(['descricao', 'cuidados', 'entrega'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? 'text-ink-800' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {tab === 'descricao' ? 'Descrição' : tab === 'cuidados' ? 'Cuidados' : 'Entrega'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-800 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">
            {activeTab === 'descricao'
              ? (product.description ?? 'Sem descrição disponível.')
              : activeTab === 'cuidados'
              ? STATIC_TABS.cuidados
              : STATIC_TABS.entrega}
          </p>
        </div>

        {/* Produtos relacionados */}
        {related.length > 0 && (
          <div>
            <h2 className="font-display italic text-2xl sm:text-3xl text-ink-800 mb-6">
              Você também pode{' '}
              <span className="text-lilac-500">gostar</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  image={typeof p.images === 'string' ? JSON.parse(p.images)[0] : p.images?.[0]}
                  price={Number(p.price)}
                  category={p.category?.name || ''}
                  stock={p.stock}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </Layout>
  )
}
