import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export function CartPage() {
  const navigate = useNavigate()
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
        <Button onClick={() => navigate('/loja')} className="bg-lilac-500 text-white hover:bg-lilac-600 rounded-pill px-8">
          Continuar Comprando
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-5xl relative">
      {/* Background soft glowing accent */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-lilac-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-petal-200/10 rounded-full blur-3xl pointer-events-none" />

      <h1 className="text-3xl md:text-4xl font-display text-ink-900 mb-8 relative">
        Seu <em className="italic text-lilac-600 font-normal">Carrinho</em>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative">
        {/* Lista de itens */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 border border-ink-200/60 rounded-2xl overflow-hidden backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-ink-200/50 text-[10px] font-bold text-ink-500 uppercase tracking-widest bg-ink-50/50">
              <div className="col-span-6">Produto</div>
              <div className="col-span-2 text-center">Preço</div>
              <div className="col-span-2 text-center">Qtd</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            <div className="divide-y divide-ink-100/60">
              {(discountedItems.length > 0 ? discountedItems : items).map((item) => {
                const isPromo = item.promotionDiscount > 0
                return (
                  <div key={`${item.productId}-${item.variantId}`} className="p-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-ink-50/40 transition-colors duration-300">
                    <div className="col-span-6 flex items-center gap-4 w-full">
                      <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100 border border-ink-200/40 shadow-sm relative group">
                        {item.productImages ? (
                          <img src={item.productImages} alt={item.productName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-lilac-500 font-bold uppercase tracking-wider">{item.categoryName}</div>
                        <div className="text-sm font-semibold text-ink-900">{item.productName}</div>
                        <div className="text-xs text-ink-500">{item.variantName || 'Único'}</div>
                        {isPromo && (
                          <div className="text-[9px] text-green-700 mt-1 font-semibold bg-green-50 border border-green-200/50 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                            {item.promotionName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 text-center w-full md:w-auto flex justify-between md:block">
                      <span className="md:hidden text-xs font-medium text-ink-500">Preço:</span>
                      <div>
                        {isPromo && <div className="text-xs text-ink-400 line-through">{formatPrice(item.price)}</div>}
                        <div className="text-sm font-semibold text-ink-800 font-mono text-[13px]">{formatPrice(item.discountedPrice || item.price)}</div>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-center w-full md:w-auto">
                      <div className="flex items-center gap-2 border border-ink-200 rounded-full px-2 py-1 bg-white/50 backdrop-blur-sm">
                        <button onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-800 rounded-full transition-colors"><Minus size={11} /></button>
                        <span className="text-xs font-bold w-5 text-center text-ink-800 font-mono">{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-800 rounded-full transition-colors"><Plus size={11} /></button>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-between md:justify-end w-full md:w-auto">
                      <span className="md:hidden text-xs font-medium text-ink-500">Subtotal:</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-ink-900 font-mono text-[13px]">{formatPrice((item.discountedPrice || item.price) * item.qty)}</span>
                        <button onClick={() => removeItem(item.productId, item.variantId)} className="w-8 h-8 rounded-full border border-ink-200 hover:border-red-200 flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <div className="bg-white/80 border border-ink-200/60 rounded-2xl p-6 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-lilac-400 via-petal-300 to-lilac-500" />
            <h3 className="text-lg font-semibold text-ink-900 mb-5 pb-3 border-b border-ink-100/50">Resumo do Pedido</h3>

            <div className="space-y-3.5 text-sm mb-6">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal dos itens</span>
                <span className="font-mono text-ink-800 text-[13px]">{formatPrice(rawTotal)}</span>
              </div>
              
              {totalPromoDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Desconto em produtos</span>
                  <span className="font-mono text-[13px]">-{formatPrice(totalPromoDiscount)}</span>
                </div>
              )}

              {coupon && (
                <div className="flex justify-between text-green-700 font-medium items-center">
                  <div className="flex items-center gap-1.5">
                    <span>Cupom ({coupon.code})</span>
                    <button onClick={removeCoupon} className="text-[9px] text-red-400 hover:text-red-600 uppercase font-semibold">(Remover)</button>
                  </div>
                  <span className="font-mono text-[13px]">-{formatPrice(couponDiscountValue)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-ink-100/60 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-ink-800">Total</span>
                <span className="text-2xl font-display italic text-ink-900">{formatPrice(finalTotal)}</span>
              </div>
              <p className="text-[10px] text-ink-500 text-right mt-1.5 uppercase tracking-wider font-semibold">Frete calculado no próximo passo</p>
            </div>

            <Button onClick={() => navigate('/checkout')} className="w-full bg-ink-900 hover:bg-lilac-500 text-white rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] duration-300 shadow-md hover:shadow-lilac-500/20 py-6 text-xs font-bold uppercase tracking-wider">
              Continuar para Pagamento
            </Button>
          </div>

          {/* Cupom */}
          <div className="bg-white/80 border border-ink-200/60 rounded-2xl p-6 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-800 mb-3.5 flex items-center gap-2">
              <Tag size={14} className="text-lilac-500" />
              Cupom de Desconto
            </h3>
            
            {coupon ? (
              <div className="bg-green-50/50 border border-green-200/60 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-green-800 tracking-wider font-mono">{coupon.code}</div>
                  <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wider mt-0.5">Cupom aplicado</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="uppercase font-mono tracking-wider focus-visible:ring-lilac-500/20 rounded-xl"
                  />
                  <Button onClick={handleApplyCoupon} disabled={isApplying || !couponCode.trim()} variant="outline" className="shrink-0 rounded-xl border-ink-200 hover:bg-ink-50 hover:text-ink-800 font-semibold text-xs py-2 px-4">
                    Aplicar
                  </Button>
                </div>
                {couponError && <p className="text-xs text-red-500 font-semibold mt-1">{couponError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {suggestedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display italic text-2xl text-ink-800 mb-6 text-center">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestedProducts.map(p => (
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
  )
}
