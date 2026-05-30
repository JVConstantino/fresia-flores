'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { GalleryUnified } from '@/components/features/GalleryUnified'
import { productService, type Product } from '@/services/productService'
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

export default function ProductPage() {
  const params = useParams()
  const slug = params?.slug as string
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
  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId) ?? null
  const currentPrice = selectedVariant?.price ?? product?.price ?? 0
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0
  const displayPrice = product?.salePrice ?? currentPrice
  const hasDiscount = product?.salePrice != null && Number(product.salePrice) < Number(currentPrice)

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      productId: product.id,
      variantId: selectedVariantId,
      productName: product.name,
      productSlug: product.slug,
      variantName: selectedVariant?.name,
      price: Number(displayPrice),
      productImages: unifiedImages[0]?.src,
      categoryName: product.category?.name,
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-ink-500">Carregando...</div>
  }

  if (notFound || !product) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-display text-ink-800 mb-4">Produto não encontrado</h1>
        <Link href="/loja">
          <Button>Voltar para a loja</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-7 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <Link href="/" className="hover:text-ink-700">Início</Link>
        <span>/</span>
        <Link href="/loja" className="hover:text-ink-700">Loja</Link>
        <span>/</span>
        <Link href={`/loja?categoria=${product.category?.slug}`} className="hover:text-ink-700">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-ink-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Galeria */}
        <div>
          <GalleryUnified
            images={unifiedImages}
            activeIndex={galleryActiveIndex}
            onIndexChange={setGalleryActiveIndex}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Categoria */}
          <Badge variant="outline" className="w-fit">
            {product.category?.name}
          </Badge>

          {/* Nome */}
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-ink-900">
            {product.name}
          </h1>

          {/* Preço */}
          <div className="flex items-baseline gap-3">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-display font-semibold text-lilac-600">
                  {formatPrice(Number(product.salePrice))}
                </span>
                <span className="text-xl text-ink-400 line-through">
                  {formatPrice(Number(currentPrice))}
                </span>
                <Badge className="bg-petal-400 text-white">
                  -{Math.round((1 - Number(product.salePrice) / Number(currentPrice)) * 100)}%
                </Badge>
              </>
            ) : (
              <span className="text-3xl font-display font-semibold text-ink-900">
                {formatPrice(Number(currentPrice))}
              </span>
            )}
          </div>

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-700 mb-2">Opções:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      selectedVariantId === variant.id
                        ? 'border-lilac-500 bg-lilac-50 text-lilac-700'
                        : 'border-ink-200 text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    {variant.name}
                    {variant.price && Number(variant.price) !== Number(product.price) && (
                      <span className="ml-1 text-xs text-ink-500">
                        ({formatPrice(Number(variant.price))})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estoque */}
          <div className="flex items-center gap-2">
            {currentStock > 0 ? (
              <>
                <span className="w-2 h-2 bg-leaf-500 rounded-full" />
                <span className="text-sm text-leaf-600">Em estoque ({currentStock} unidades)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-red-600">Fora de estoque</span>
              </>
            )}
          </div>

          {/* Mensagem */}
          <div>
            <p className="text-sm font-medium text-ink-700 mb-2">Mensagem para o cartão (opcional):</p>
            <Textarea
              placeholder="Ex: Parabéns, mãe! Com amor, João."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              className="resize-none"
            />
            <p className="text-xs text-ink-400 mt-1">{message.length}/200 caracteres</p>
          </div>

          {/* Botão adicionar */}
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={currentStock <= 0}
            className="bg-lilac-500 hover:bg-lilac-600 text-white"
          >
            {currentStock > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
          </Button>

          {/* Tabs */}
          <div className="border-t border-ink-200 pt-6">
            <div className="flex gap-4 mb-4">
              {(['descricao', 'cuidados', 'entrega'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-lilac-500 text-lilac-600'
                      : 'border-transparent text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {tab === 'descricao' ? 'Descrição' : tab === 'cuidados' ? 'Cuidados' : 'Entrega'}
                </button>
              ))}
            </div>
            <div className="text-sm text-ink-600 leading-relaxed">
              {activeTab === 'descricao'
                ? product.description || 'Sem descrição disponível.'
                : STATIC_TABS[activeTab]}
            </div>
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-display font-semibold text-ink-900 mb-6">
            Produtos <em className="italic text-lilac-600">Relacionados</em>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                image={p.images?.[0]}
                price={p.salePrice || p.price}
                originalPrice={p.salePrice ? p.price : undefined}
                category={p.category?.name || 'Flores'}
                stock={p.stock}
                onQuickView={() => setQuickViewProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  )
}
