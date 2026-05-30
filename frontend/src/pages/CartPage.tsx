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
    <div className="container mx-auto px-5 py-12 max-w-5xl">
      <h1 className="text-3xl font-display text-ink-800 mb-8">Seu Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lista de itens */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-ink-200 text-xs font-semibold text-ink-500 uppercase tracking-wider bg-ink-50">
              <div className="col-span-6">Produto</div>
              <div className="col-span-2 text-center">Preço</div>
              <div className="col-span-2 text-center">Qtd</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            <div className="divide-y divide-ink-100">
              {(discountedItems.length > 0 ? discountedItems : items).map((item) => {
                const isPromo = item.promotionDiscount > 0
                return (
                  <div key={`${item.productId}-${item.variantId}`} className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center gap-4 w-full">
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100">
                        {item.productImages ? (
                          <img src={item.productImages} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] text-lilac-500 font-semibold uppercase">{item.categoryName}</div>
                        <div className="text-sm font-semibold text-ink-800">{item.productName}</div>
                        <div className="text-xs text-ink-500">{item.variantName || 'Único'}</div>
                        {isPromo && <div className="text-[10px] text-green-600 mt-1 font-medium bg-green-50 inline-block px-1.5 py-0.5 rounded">{item.promotionName}</div>}
                      </div>
                    </div>

                    <div className="col-span-2 text-center w-full md:w-auto flex justify-between md:block">
                      <span className="md:hidden text-xs text-ink-500">Preço:</span>
                      <div>
                        {isPromo && <div className="text-xs text-ink-400 line-through">{formatPrice(item.price)}</div>}
                        <div className="text-sm font-medium text-ink-800">{formatPrice(item.discountedPrice || item.price)}</div>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-center w-full md:w-auto">
                      <div className="flex items-center gap-2 border border-ink-200 rounded-full px-2 py-1">
                        <button onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-ink-500 hover:bg-ink-50 rounded-full"><Minus size={12} /></button>
                        <span className="text-xs font-semibold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-ink-500 hover:bg-ink-50 rounded-full"><Plus size={12} /></button>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-between md:justify-end w-full md:w-auto">
                      <span className="md:hidden text-xs text-ink-500">Subtotal:</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-ink-800">{formatPrice((item.discountedPrice || item.price) * item.qty)}</span>
                        <button onClick={() => removeItem(item.productId, item.variantId)} className="text-ink-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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
          <div className="bg-white border border-ink-200 rounded-xl p-6">
            <h3 className="text-lg font-display text-ink-800 mb-4">Resumo do Pedido</h3>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal dos itens</span>
                <span>{formatPrice(rawTotal)}</span>
              </div>
              
              {totalPromoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto em produtos</span>
                  <span>-{formatPrice(totalPromoDiscount)}</span>
                </div>
              )}

              {coupon && (
                <div className="flex justify-between text-green-600 items-center">
                  <div className="flex items-center gap-1">
                    <span>Cupom ({coupon.code})</span>
                    <button onClick={removeCoupon} className="text-[10px] text-red-400 hover:text-red-600 uppercase ml-1">(Remover)</button>
                  </div>
                  <span>-{formatPrice(couponDiscountValue)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-ink-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-ink-800">Total</span>
                <span className="text-2xl font-display italic text-ink-900">{formatPrice(finalTotal)}</span>
              </div>
              <p className="text-xs text-ink-500 text-right mt-1">Frete calculado no próximo passo</p>
            </div>

            <Button onClick={() => navigate('/checkout')} className="w-full bg-ink-900 hover:bg-lilac-500 text-white rounded-pill transition-colors py-6 text-sm font-semibold uppercase tracking-wider">
              Continuar para Pagamento
            </Button>
          </div>

          {/* Cupom */}
          <div className="bg-white border border-ink-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
              <Tag size={16} className="text-lilac-500" />
              Cupom de Desconto
            </h3>
            
            {coupon ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-green-800">{coupon.code}</div>
                  <div className="text-xs text-green-600">Cupom aplicado com sucesso</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="uppercase"
                  />
                  <Button onClick={handleApplyCoupon} disabled={isApplying || !couponCode.trim()} variant="outline" className="shrink-0">
                    Aplicar
                  </Button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
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
