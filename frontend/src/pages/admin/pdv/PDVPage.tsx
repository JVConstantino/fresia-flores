import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, User, X, Printer, ShoppingCart, Package, Layers, Banknote, QrCode, CreditCard, Check } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { pdvService, type PdvProduct, type PdvCustomer, type PdvSaleItem } from '@/services/pdvService'

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function firstImage(images: any): string | null {
  try {
    if (!images) return null
    if (Array.isArray(images)) return images[0] ?? null
    if (typeof images === 'string') {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed[0] ?? null : null
    }
    return null
  } catch { return null }
}

interface CartItem extends PdvSaleItem {
  name: string
  variantName?: string
  image?: string | null
}

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'pix_pdv', label: 'PIX', icon: QrCode },
  { value: 'card_pdv', label: 'Cartão', icon: CreditCard },
] as const

// Cliente "avulso" — venda sem cadastro. id 0 faz o backend usar o padrão "Cliente PDV".
const WALK_IN_CUSTOMER: PdvCustomer = { id: 0, name: 'Cliente PDV', email: 'Venda avulsa' }

export function PDVPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<PdvProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [variantModal, setVariantModal] = useState<{ open: boolean; product: PdvProduct | null }>({ open: false, product: null })

  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<PdvCustomer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<PdvCustomer | null>(null)
  const [customerFocus, setCustomerFocus] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix_pdv' | 'card_pdv'>('cash')
  const [installments, setInstallments] = useState(1)
  const [discount, setDiscount] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<any>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoadingProducts(true)
      pdvService.searchProducts(search).then(p => setProducts(p)).finally(() => setLoadingProducts(false))
    }, 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (selectedCustomer) { setCustomers([]); return }
    if (!customerFocus && !customerSearch) { return }
    const t = setTimeout(() => {
      pdvService.searchCustomers(customerSearch).then(setCustomers)
    }, customerSearch ? 250 : 0)
    return () => clearTimeout(t)
  }, [customerSearch, selectedCustomer, customerFocus])

  function addToCart(p: PdvProduct, variant?: PdvProduct['variants'][0]) {
    const price = Number(variant?.salePrice ?? variant?.price ?? p.salePrice ?? p.price)
    const key = `${p.id}-${variant?.id ?? 'null'}`
    setCart(curr => {
      const existing = curr.find(i => `${i.productId}-${i.variantId ?? 'null'}` === key)
      if (existing) {
        return curr.map(i => i === existing ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...curr, {
        productId: p.id,
        variantId: variant?.id ?? null,
        qty: 1,
        price,
        name: p.name,
        variantName: variant?.name,
        image: firstImage(p.images),
      }]
    })
  }

  function updateQty(i: number, qty: number) {
    if (qty <= 0) setCart(c => c.filter((_, idx) => idx !== i))
    else setCart(c => c.map((it, idx) => idx === i ? { ...it, qty } : it))
  }

  function cartQtyForProduct(productId: number) {
    return cart.reduce((sum, i) => i.productId === productId ? sum + i.qty : sum, 0)
  }

  function onCardClick(p: PdvProduct) {
    if (p.variants.length > 0) {
      setVariantModal({ open: true, product: p })
    } else if (p.stock > 0) {
      addToCart(p)
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discountNum = Number(discount) || 0
  const total = Math.max(0, subtotal - discountNum)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  async function finalizeSale() {
    if (cart.length === 0) { toast.error('Carrinho vazio'); return }
    if (!selectedCustomer) { toast.error('Selecione um cliente (ou "Cliente PDV" para venda avulsa)'); return }
    setSubmitting(true)
    try {
      const order = await pdvService.createSale({
        items: cart.map(c => ({ productId: c.productId, variantId: c.variantId, qty: c.qty, price: c.price })),
        customerId: selectedCustomer.id || undefined,
        paymentMethod,
        installments: paymentMethod === 'card_pdv' ? installments : 1,
        discount: discountNum,
      })
      setReceipt({ ...order, items: cart, paymentMethod, installments, discount: discountNum, total })
      setCart([])
      setSelectedCustomer(null)
      setCustomerSearch('')
      setDiscount('')
      toast.success('Venda finalizada')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao finalizar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout title="PDV — Ponto de Venda" description="Vendas presenciais">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
        {/* Esquerda — Produtos */}
        <div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-3 py-3 border border-ink-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20 focus:border-lilac-400 transition-shadow"
              autoFocus
            />
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden">
                  <div className="aspect-square bg-ink-100 animate-pulse" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-2 w-12 bg-ink-100 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-ink-100 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-ink-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg text-center">
              <div className="w-14 h-14 rounded-full bg-lilac-50 flex items-center justify-center mb-3">
                {search ? <Package size={24} className="text-lilac-400" /> : <Search size={24} className="text-lilac-400" />}
              </div>
              <p className="text-ink-600 font-medium">{search ? 'Nenhum produto encontrado' : 'Comece a buscar'}</p>
              <p className="text-ink-400 text-sm mt-0.5">{search ? 'Tente outro termo de busca' : 'Digite o nome de um produto para vender'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map(p => {
                const img = firstImage(p.images)
                const price = Number(p.salePrice ?? p.price)
                const inCart = cartQtyForProduct(p.id)
                const hasVariants = p.variants.length > 0
                const soldOut = !hasVariants && p.stock <= 0
                return (
                  <button
                    key={p.id}
                    onClick={() => onCardClick(p)}
                    disabled={soldOut}
                    className={`group relative bg-white rounded-lg overflow-hidden text-left h-full flex flex-col transition-all ${
                      soldOut
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:-translate-y-0.5 hover:shadow-md'
                    } ${inCart > 0 ? 'ring-1 ring-lilac-300' : ''}`}
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-lilac-100 to-petal-100 overflow-hidden">
                      {img
                        ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl">🌸</div>}

                      {/* Badge qtd no carrinho */}
                      {inCart > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-lilac-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                          {inCart}
                        </span>
                      )}

                      {/* Selo de variações / esgotado */}
                      {hasVariants && (
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-ink-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          <Layers size={10} /> {p.variants.length} opções
                        </span>
                      )}
                      {soldOut && (
                        <span className="absolute bottom-1.5 left-1.5 bg-petal-400 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Esgotado
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col">
                      <p className="text-[10px] text-lilac-500 uppercase tracking-wide font-semibold truncate">{p.category.name}</p>
                      <p className="text-sm font-medium text-ink-800 line-clamp-1 leading-tight">{p.name}</p>
                      <div className="mt-auto pt-1.5 flex items-end justify-between gap-1">
                        <div className="min-w-0">
                          {p.salePrice != null && Number(p.salePrice) < Number(p.price) && (
                            <span className="block text-[10px] text-ink-400 line-through leading-none">{formatPrice(Number(p.price))}</span>
                          )}
                          <span className="font-display italic text-lilac-600 text-base leading-tight">{formatPrice(price)}</span>
                        </div>
                        {!soldOut && (
                          <span className="shrink-0 w-7 h-7 rounded-full bg-lilac-500 text-white flex items-center justify-center group-hover:bg-lilac-600 transition-colors">
                            <Plus size={15} />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Direita — Carrinho */}
        <div>
          <div className="bg-white rounded-lg sticky top-24 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-lilac-500" />
                <h3 className="font-semibold text-ink-800 text-sm">Carrinho</h3>
              </div>
              {cartCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-lilac-100 text-lilac-700 text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Cliente */}
            <div className="p-3 border-b border-ink-100">
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-lilac-50 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <div className="w-7 h-7 rounded-full bg-lilac-200 text-lilac-700 flex items-center justify-center shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink-800 leading-tight truncate">{selectedCustomer.name}</p>
                      <p className="text-xs text-ink-500 truncate">{selectedCustomer.id === 0 ? 'Venda avulsa' : selectedCustomer.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="text-ink-400 hover:text-ink-600 shrink-0 ml-2">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    onFocus={() => setCustomerFocus(true)}
                    onBlur={() => setTimeout(() => setCustomerFocus(false), 150)}
                    placeholder="Selecione o cliente"
                    className="w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac-500/20 focus:border-lilac-400"
                  />
                  {customerFocus && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto border border-ink-100">
                      {/* Opção fixa: venda avulsa */}
                      <button
                        onMouseDown={() => { setSelectedCustomer(WALK_IN_CUSTOMER); setCustomerSearch(''); setCustomers([]); setCustomerFocus(false) }}
                        className="w-full text-left px-3 py-2 hover:bg-lilac-50 text-sm border-b border-ink-100 flex items-center gap-2"
                      >
                        <span className="w-6 h-6 rounded-full bg-lilac-100 text-lilac-600 flex items-center justify-center shrink-0">
                          <User size={12} />
                        </span>
                        <span>
                          <span className="block font-medium text-ink-800 leading-tight">Cliente PDV</span>
                          <span className="block text-xs text-ink-500 leading-tight">Venda avulsa (sem cadastro)</span>
                        </span>
                      </button>

                      {customers.length > 0 && (
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400 border-b border-ink-50">
                          {customerSearch ? 'Resultados' : 'Clientes recentes'}
                        </p>
                      )}
                      {customers.map(c => (
                        <button
                          key={c.id}
                          onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]); setCustomerFocus(false) }}
                          className="w-full text-left px-3 py-2 hover:bg-ink-50 text-sm border-b border-ink-50 last:border-0"
                        >
                          <p className="font-medium text-ink-800">{c.name}</p>
                          <p className="text-xs text-ink-500">{c.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-ink-50 flex items-center justify-center mb-2">
                    <ShoppingCart size={20} className="text-ink-300" />
                  </div>
                  <p className="text-ink-500 text-sm font-medium">Carrinho vazio</p>
                  <p className="text-ink-400 text-xs mt-0.5">Toque num produto para adicionar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((it, i) => (
                    <div key={i} className="flex gap-2.5 items-center bg-ink-50/60 rounded-lg p-2">
                      <div className="w-12 h-14 bg-white rounded-md overflow-hidden flex-shrink-0">
                        {it.image ? <img src={it.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🌸</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-800 line-clamp-1">{it.name}</p>
                        {it.variantName && <p className="text-[10px] text-lilac-600">{it.variantName}</p>}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button onClick={() => updateQty(i, it.qty - 1)} className="w-6 h-6 rounded-md bg-white border border-ink-200 text-ink-600 hover:bg-ink-100 flex items-center justify-center transition-colors"><Minus size={11} /></button>
                          <span className="text-xs font-semibold w-6 text-center tabular-nums">{it.qty}</span>
                          <button onClick={() => updateQty(i, it.qty + 1)} className="w-6 h-6 rounded-md bg-white border border-ink-200 text-ink-600 hover:bg-ink-100 flex items-center justify-center transition-colors"><Plus size={11} /></button>
                          <button onClick={() => updateQty(i, 0)} className="ml-auto w-6 h-6 rounded-md text-petal-400 hover:bg-petal-50 hover:text-petal-600 flex items-center justify-center transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-ink-800 self-start tabular-nums">{formatPrice(it.price * it.qty)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-ink-100 space-y-3">
              {/* Pagamento */}
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_OPTIONS.map(p => {
                  const Icon = p.icon
                  const active = paymentMethod === p.value
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPaymentMethod(p.value)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-semibold border-2 transition-all ${
                        active ? 'border-lilac-500 bg-lilac-50 text-lilac-700' : 'border-ink-200 text-ink-500 hover:border-ink-300'
                      }`}
                    >
                      <Icon size={16} />
                      {p.label}
                    </button>
                  )
                })}
              </div>

              {paymentMethod === 'card_pdv' && (
                <select
                  value={installments}
                  onChange={e => setInstallments(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-ink-200 rounded-md text-xs bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}x de {formatPrice(total / n)}</option>
                  ))}
                </select>
              )}

              <Input
                type="number"
                step="0.01"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="Desconto (R$)"
                className="text-sm"
              />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                {discountNum > 0 && (
                  <div className="flex justify-between text-leaf-600 text-xs">
                    <span>Desconto</span>
                    <span className="tabular-nums">-{formatPrice(discountNum)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-ink-800 pt-2 border-t border-ink-100">
                  <span className="font-semibold">Total</span>
                  <span className="font-display italic text-xl text-lilac-600 tabular-nums">{formatPrice(total)}</span>
                </div>
              </div>

              <Button onClick={finalizeSale} disabled={submitting || cart.length === 0 || !selectedCustomer} className="w-full bg-lilac-500 hover:bg-lilac-600 py-5 text-base gap-2">
                {submitting ? 'Processando...' : <><Check size={16} /> Finalizar Venda</>}
              </Button>
              {!selectedCustomer && cart.length > 0 && (
                <p className="text-center text-xs text-petal-500">Selecione um cliente para finalizar</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup de variações */}
      <VariantPicker
        state={variantModal}
        cartQtyForProduct={cartQtyForProduct}
        onAdd={(p, v) => { addToCart(p, v); toast.success(`${v.name} adicionado`) }}
        onClose={() => setVariantModal({ open: false, product: null })}
      />

      {receipt && <SaleReceipt receipt={receipt} onClose={() => setReceipt(null)} />}
    </AdminLayout>
  )
}

function VariantPicker({
  state, onAdd, onClose, cartQtyForProduct,
}: {
  state: { open: boolean; product: PdvProduct | null }
  onAdd: (p: PdvProduct, v: PdvProduct['variants'][0]) => void
  onClose: () => void
  cartQtyForProduct: (productId: number) => number
}) {
  const p = state.product
  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{p?.name ?? 'Variações'}</DialogTitle>
        </DialogHeader>

        {p && (
          <div className="space-y-2 pt-1">
            {p.variants.map(v => {
              const price = Number(v.salePrice ?? v.price)
              const hasSale = v.salePrice != null && Number(v.salePrice) < Number(v.price)
              const soldOut = v.stock <= 0
              return (
                <div key={v.id} className="flex items-center gap-3 bg-ink-50/60 rounded-lg p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{v.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {hasSale && <span className="text-xs text-ink-400 line-through">{formatPrice(Number(v.price))}</span>}
                      <span className="text-sm font-display italic text-lilac-600">{formatPrice(price)}</span>
                      <span className={`text-[11px] ${soldOut ? 'text-petal-500' : 'text-ink-400'}`}>
                        {soldOut ? 'Esgotado' : `Estoque ${v.stock}`}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={soldOut}
                    onClick={() => onAdd(p, v)}
                    className="bg-lilac-500 hover:bg-lilac-600 text-white gap-1.5 shrink-0"
                  >
                    <Plus size={14} /> Adicionar
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-ink-400">
            {p && cartQtyForProduct(p.id) > 0 ? `${cartQtyForProduct(p.id)} no carrinho` : 'Selecione as variações'}
          </span>
          <Button variant="outline" onClick={onClose}>Concluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SaleReceipt({ receipt, onClose }: { receipt: any; onClose: () => void }) {
  const paymentLabel = receipt.paymentMethod === 'cash' ? 'Dinheiro' : receipt.paymentMethod === 'pix_pdv' ? 'PIX' : 'Cartão'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-transparent print:p-0">
      <div className="bg-white rounded-xl max-w-sm w-full flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:max-w-none print:rounded-none print:shadow-none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center">
              <Check size={15} />
            </div>
            <div>
              <h3 className="font-semibold text-ink-800 text-sm leading-tight">Venda concluída</h3>
              <p className="text-[11px] text-ink-400 leading-tight">Cupom não-fiscal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X size={18} /></button>
        </div>

        <div id="receipt-print" className="px-4 py-4 overflow-y-auto font-mono text-xs">
          <div className="text-center mb-3">
            <img src="/logo-fresia.png" alt="Frésia" className="h-10 mx-auto mb-1" />
            <p className="font-bold">FRÉSIA FLORES</p>
            <p>Rua das Flores, 123 — Nova Friburgo / RJ</p>
            <p>CNPJ: 00.000.000/0001-00</p>
          </div>
          <div className="border-t border-b border-dashed border-ink-300 py-1 text-center font-bold">
            CUPOM NÃO-FISCAL
          </div>
          <div className="my-2">
            <p>Pedido: #{receipt.id}</p>
            <p>Data: {new Date().toLocaleString('pt-BR')}</p>
            <p>Cliente: {receipt.customerName}</p>
          </div>
          <div className="border-t border-dashed border-ink-300 pt-1">
            {receipt.items.map((it: any, i: number) => (
              <div key={i} className="mb-1">
                <p>{it.name} {it.variantName ? `(${it.variantName})` : ''}</p>
                <p className="flex justify-between">
                  <span>{it.qty} × {formatPrice(it.price)}</span>
                  <span>{formatPrice(it.qty * it.price)}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-ink-300 pt-1 mt-2">
            {receipt.discount > 0 && (
              <p className="flex justify-between"><span>Desconto:</span><span>-{formatPrice(receipt.discount)}</span></p>
            )}
            <p className="flex justify-between font-bold text-sm"><span>TOTAL:</span><span>{formatPrice(receipt.total)}</span></p>
            <p className="flex justify-between mt-1"><span>Pagamento:</span><span>{paymentLabel}</span></p>
            {receipt.paymentMethod === 'card_pdv' && receipt.installments > 1 && (
              <p className="flex justify-between"><span>Parcelas:</span><span>{receipt.installments}x</span></p>
            )}
          </div>
          <div className="text-center mt-4 border-t border-dashed border-ink-300 pt-2">
            <p>Obrigado pela preferência!</p>
            <p className="mt-1">@fresiaflores</p>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-ink-100 print:hidden">
          <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
          <Button onClick={() => window.print()} className="flex-1 bg-lilac-500 hover:bg-lilac-600 gap-2">
            <Printer size={14} /> Imprimir
          </Button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; left: 0; top: 0; width: 80mm; padding: 5mm; font-size: 10px; }
        }
      `}</style>
    </div>
  )
}
