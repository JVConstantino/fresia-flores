'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Plus, Minus, Tag } from 'lucide-react'
import { useCartStore, selectTotal } from '@/store/cartStore'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { productService, type Product } from '@/services/productService'
import { ProductCard } from '@/components/features/ProductCard'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export default function CartPage() {
  const router = useRouter()
  const { items, updateQty, removeItem, coupon, applyCoupon, removeCoupon } = useCartStore()
  const rawTotal = useCartStore(selectTotal)

  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [discountedItems, setDiscountedItems] = useState<any[]>([])
  const [totalPromoDiscount, setTotalPromoDiscount] = useState(0)

  // Produtos Relacionados
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])

  useEffect(() => {
    if (items.length > 0) {
      calculatePromotions()
      fetchSuggestedProducts()
    } else {
      setDiscountedItems([])
      setTotalPromoDiscount(0)
      setSuggestedProducts([])
    }
  }, [items])

  const fetchSuggestedProducts = async () => {
    try {
      const allProducts = await productService.findAll()
      const cartCategoryNames = items.map(i => i.categoryName)
      const filtered = allProducts.filter(p =>
        cartCategoryNames.includes(p.category?.name) &&
        !items.some(i => i.productId === p.id)
      )
      setSuggestedProducts(filtered.slice(0, 4))
    } catch {
      // ignora
    }
  }

  const calculatePromotions = async () => {
    try {
      const res = await api.post('/discounts/calculate', { items })
      setDiscountedItems(res.data.items)
      setTotalPromoDiscount(res.data.totalPromotionDiscount)
    } catch (err) {
      console.error('Erro ao calcular promoções:', err)
      setDiscountedItems(items.map(i => ({ ...i, discountedPrice: i.price, promotionDiscount: 0 })))
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setIsApplying(true)
    setCouponError('')
    try {
      // O subtotal para o cupom é o valor já com promoções
      const subtotalWithPromos = rawTotal - totalPromoDiscount
      const res = await api.post('/coupons/validate', { code: couponCode, orderTotal: subtotalWithPromos })
      applyCoupon(res.data)
      setCouponCode('')
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Cupom inválido')
    } finally {
      setIsApplying(false)
    }
  }

  const subtotalWithPromos = rawTotal - totalPromoDiscount
  const couponDiscountValue = coupon
    ? (coupon.discountType === 'percentage' ? subtotalWithPromos * (coupon.discountValue / 100) : coupon.discountValue)
    : 0

  const finalTotal = Math.max(0, subtotalWithPromos - couponDiscountValue)

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-5 py-20 text-center max-w-xl">
        <h1 className="text-3xl font-display text-ink-800 mb-6">Seu Carrinho</h1>
        <p className="text-ink-500 mb-8">Seu carrinho está vazio.</p>
        <Link href="/loja">
          <Button className="bg-lilac-500 text-white hover:bg-lilac-600 rounded-full px-8">
            Continuar Comprando
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-7 py-8 sm:py-12 max-w-4xl">
      <h1 className="text-3xl font-display font-semibold text-ink-900 mb-8">Seu Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const discountedItem = discountedItems.find(
              (d: any) => d.productId === item.productId && d.variantId === item.variantId
            )
            const itemPrice = discountedItem?.discountedPrice ?? item.price
            const hasDiscount = discountedItem?.promotionDiscount > 0

            return (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-4 p-4 bg-white rounded-xl border border-ink-200"
              >
                {/* Imagem */}
                <div className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100">
                  {item.productImages ? (
                    <img src={item.productImages} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-lilac-500 font-medium uppercase tracking-wider">
                    {item.categoryName}
                  </p>
                  <h3 className="text-sm font-medium text-ink-800 truncate">{item.productName}</h3>
                  {item.variantName && (
                    <p className="text-xs text-ink-500">{item.variantName}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-base text-lilac-600">
                            {formatPrice(Number(itemPrice))}
                          </span>
                          <span className="text-xs text-ink-400 line-through">
                            {formatPrice(Number(item.price))}
                          </span>
                        </div>
                      ) : (
                        <span className="font-display text-base text-ink-800">
                          {formatPrice(Number(itemPrice))}
                        </span>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
                        className="w-7 h-7 rounded-full border border-ink-200 flex items-center justify-center hover:bg-ink-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
                        className="w-7 h-7 rounded-full border border-ink-200 flex items-center justify-center hover:bg-ink-50"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-red-50 ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-ink-200 p-6 sticky top-24">
            <h2 className="text-lg font-display font-semibold text-ink-900 mb-4">Resumo</h2>

            {/* Cupom */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <Input
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleApplyCoupon}
                  disabled={isApplying || !couponCode.trim()}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Aplicar
                </Button>
              </div>
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
              {coupon && (
                <div className="flex items-center justify-between mt-2 p-2 bg-lilac-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-lilac-500" />
                    <span className="text-sm text-lilac-700">{coupon.code}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-ink-500 hover:text-ink-700">
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* Valores */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="text-ink-800">{formatPrice(rawTotal)}</span>
              </div>
              {totalPromoDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-leaf-600">Desconto promoções</span>
                  <span className="text-leaf-600">-{formatPrice(totalPromoDiscount)}</span>
                </div>
              )}
              {couponDiscountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-lilac-600">Desconto cupom</span>
                  <span className="text-lilac-600">-{formatPrice(couponDiscountValue)}</span>
                </div>
              )}
              <div className="border-t border-ink-200 pt-3 flex justify-between">
                <span className="font-medium text-ink-800">Total</span>
                <span className="font-display text-xl font-semibold text-ink-900">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Checkout */}
            <Button
              onClick={() => router.push('/checkout')}
              className="w-full bg-lilac-500 hover:bg-lilac-600 text-white"
              size="lg"
            >
              Finalizar Compra
            </Button>

            <Link href="/loja" className="block text-center text-sm text-ink-500 hover:text-ink-700 mt-4">
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>

      {/* Sugeridos */}
      {suggestedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-display font-semibold text-ink-900 mb-4">
            Você também pode <em className="italic text-lilac-600">gostar</em>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestedProducts.map((p) => (
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
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
