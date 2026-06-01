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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    descricao: true,
    cuidados: false,
    entrega: false,
  })
  const [message, setMessage] = useState('')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<any[]>([])

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

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
        
        // Fetch reviews for this product
        productService.getReviews(p.id)
          .then(setReviews)
          .catch(() => setReviews([]))

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

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 mb-14 sm:mb-20">
          {/* Galeria unificada */}
          <div className="max-w-md mx-auto lg:max-w-none w-full">
            <GalleryUnified
              images={unifiedImages}
              activeIndex={galleryActiveIndex}
              onIndexChange={setGalleryActiveIndex}
            />
          </div>

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
              className="bg-ink-800 hover:bg-lilac-500 text-white w-full py-3 rounded-pill text-sm font-semibold transition-colors mb-6"
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

            {/* Accordion de detalhes abaixo do botão */}
            <div className="border-t border-ink-200 divide-y divide-ink-200">
              {[
                { id: 'descricao', title: 'Descrição', content: product.description ?? 'Sem descrição disponível.' },
                { id: 'cuidados', title: 'Instruções de Cuidado', content: STATIC_TABS.cuidados },
                { id: 'entrega', title: 'Informações de Entrega', content: STATIC_TABS.entrega }
              ].map(section => {
                const isOpen = openSections[section.id]
                return (
                  <div key={section.id} className="py-3">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-ink-700 hover:text-lilac-600 transition-colors"
                    >
                      <span>{section.title}</span>
                      <span className="text-sm font-light">{isOpen ? '−' : '＋'}</span>
                    </button>
                    <div
                      className={`mt-2 text-xs text-ink-600 leading-relaxed overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                      }`}
                    >
                      {section.content}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Avaliações de Compradores Verificados */}
        <section className="mb-14 sm:mb-20 border-t border-ink-200 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display italic text-2xl sm:text-3xl text-ink-800">
                Avaliações de <span className="text-lilac-500">Compradores</span>
              </h2>
              <p className="text-xs text-ink-500 mt-1">Opiniões de clientes reais que compraram este produto</p>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 bg-lilac-50 border border-lilac-100 px-3.5 py-2 rounded-xl w-fit">
                <span className="text-sm font-bold text-lilac-700">
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} ★
                </span>
                <span className="text-xs text-lilac-600 font-medium">({reviews.length} avaliações)</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-ink-50 border border-dashed border-ink-200 rounded-xl p-8 text-center text-ink-500">
              <span className="text-2xl block mb-2">⭐</span>
              <p className="text-sm">Nenhuma avaliação para este produto ainda.</p>
              <p className="text-[10px] text-ink-400 mt-1">Comentários e notas de clientes são exibidos após a entrega do pedido.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-ink-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-sm text-ink-800">{rev.clientName}</p>
                      <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Comprador Verificado
                      </p>
                    </div>
                    <div className="flex gap-0.5 text-amber-500 font-bold text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                      {Array.from({ length: 5 - rev.rating }).map((_, i) => (
                        <span key={i} className="text-ink-200">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed italic">"{rev.text}"</p>
                  <p className="text-[9px] text-ink-400 mt-3 text-right">
                    {new Date(rev.createdAt || rev.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

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
