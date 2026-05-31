import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GalleryUnified } from './GalleryUnified'
import { productService, type Product } from '@/services/productService'
import { useCartStore } from '@/store/cartStore'

interface QuickViewDialogProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

function parseImages(raw: any): string[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : []
  } catch { return [] }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export function QuickViewDialog({ product, open, onClose }: QuickViewDialogProps) {
  const [fullProduct, setFullProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const { addItem } = useCartStore()

  useEffect(() => {
    if (!product || !open) return
    setLoading(true)
    setGalleryIndex(0)
    productService.findBySlug(product.slug)
      .then(p => {
        setFullProduct(p)
        setSelectedVariantId(p.variants[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [product?.slug, open])

  if (!product) return null

  const data = fullProduct ?? product
  const selectedVariant = data.variants?.find((v: any) => v.id === selectedVariantId)
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : Number(data.price)
  const displaySalePrice = selectedVariant?.salePrice ? Number(selectedVariant.salePrice) : null

  // Build unified images
  const unifiedImages: { src: string; variantId: number | null }[] = []
  parseImages(data.images).forEach((src: string) => unifiedImages.push({ src, variantId: null }))
  if (data.variants) {
    data.variants.forEach((v: any) => {
      parseImages(v.images).forEach((src: string) => unifiedImages.push({ src, variantId: v.id }))
    })
  }

  const handleSelectVariant = (variantId: number) => {
    setSelectedVariantId(variantId)
    const firstIdx = unifiedImages.findIndex(img => img.variantId === variantId)
    if (firstIdx >= 0) setGalleryIndex(firstIdx)
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {loading ? (
          <div className="h-80 flex items-center justify-center text-ink-400">Carregando...</div>
        ) : (
          <div className="grid grid-cols-[1fr_1fr]">
            {/* Galeria */}
            <div className="bg-ink-50 p-4">
              {unifiedImages.length > 0 ? (
                <GalleryUnified
                  images={unifiedImages}
                  activeIndex={galleryIndex}
                  onIndexChange={setGalleryIndex}
                />
              ) : (
                <div className="aspect-[3/4] bg-gradient-to-br from-lilac-100 to-petal-100 rounded-lg flex items-center justify-center text-6xl">🌸</div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 flex flex-col overflow-y-auto max-h-[80vh]">
              <Badge variant="outline" className="w-fit text-lilac-500 border-lilac-200 mb-3 text-[10px]">
                {data.category?.name}
              </Badge>

              <h2 className="text-xl font-semibold text-ink-800 leading-snug mb-3">
                {data.name}
              </h2>

              {data.description && (
                <p className="text-sm text-ink-500 leading-relaxed mb-4">
                  {data.description.length > 150
                    ? data.description.slice(0, 150) + '...'
                    : data.description}
                </p>
              )}

              {/* Variantes */}
              {data.variants?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">Opções</div>
                  <div className="flex flex-wrap gap-2">
                    {data.variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelectVariant(v.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          selectedVariantId === v.id
                            ? 'border-ink-800 bg-ink-50 text-ink-800 font-semibold ring-1 ring-ink-800'
                            : 'border-ink-200 text-ink-500 hover:border-lilac-400'
                        }`}
                      >
                        <span>{v.name}</span>
                        {v.description && <span className="block text-[10px] text-ink-400">{v.description}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preço */}
              <div className="mb-6">
                {displaySalePrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display italic text-xl text-ink-400 line-through">{formatPrice(displayPrice)}</span>
                    <span className="font-display italic text-3xl text-petal-500">{formatPrice(displaySalePrice)}</span>
                  </div>
                ) : (
                  <span className="font-display italic text-3xl text-ink-800">{formatPrice(displayPrice)}</span>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <Button
                  className="bg-ink-800 hover:bg-lilac-500 text-white w-full transition-colors"
                  onClick={() => {
                    addItem({
                      productId: data.id,
                      productName: data.name,
                      productSlug: data.slug,
                      categoryName: data.category?.name ?? '',
                      variantId: selectedVariant?.id ?? null,
                      variantName: selectedVariant?.name ?? null,
                      price: displaySalePrice ?? displayPrice,
                      productImages: unifiedImages[galleryIndex]?.src ?? unifiedImages[0]?.src,
                    })
                    onClose()
                  }}
                >
                  Adicionar ao carrinho
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/produto/${data.slug}`}>Ver produto completo</a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
