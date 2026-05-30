import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, User, X, Receipt, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix_pdv', label: 'PIX' },
  { value: 'card_pdv', label: 'Cartão' },
] as const

export function PDVPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<PdvProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])

  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<PdvCustomer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<PdvCustomer | null>(null)

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
    if (!customerSearch || selectedCustomer) { setCustomers([]); return }
    const t = setTimeout(() => {
      pdvService.searchCustomers(customerSearch).then(setCustomers)
    }, 250)
    return () => clearTimeout(t)
  }, [customerSearch, selectedCustomer])

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

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discountNum = Number(discount) || 0
  const total = Math.max(0, subtotal - discountNum)

  async function finalizeSale() {
    if (cart.length === 0) { toast.error('Carrinho vazio'); return }
    setSubmitting(true)
    try {
      const order = await pdvService.createSale({
        items: cart.map(c => ({ productId: c.productId, variantId: c.variantId, qty: c.qty, price: c.price })),
        customerId: selectedCustomer?.id,
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 -mx-2">
        {/* Esquerda — Produtos */}
        <div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-3 py-3 border border-ink-200 rounded-lg text-base bg-white"
              autoFocus
            />
          </div>

          {loadingProducts ? (
            <div className="text-center py-12 text-ink-400">Carregando...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-ink-400 bg-white border border-ink-200 rounded-xl">
              {search ? 'Nenhum produto encontrado' : 'Digite para buscar produtos'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map(p => {
                const img = firstImage(p.images)
                const price = Number(p.salePrice ?? p.price)
                return (
                  <button
                    key={p.id}
                    onClick={() => p.variants.length === 0 ? addToCart(p) : null}
                    className="bg-white border border-ink-200 rounded-xl overflow-hidden hover:border-lilac-400 hover:shadow-md transition-all text-left h-full flex flex-col"
                  >
                    <div className="aspect-square bg-gradient-to-br from-lilac-100 to-petal-100 overflow-hidden">
                      {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🌸</div>}
                    </div>
                    <div className="p-2 flex-1 flex flex-col">
                      <p className="text-xs text-lilac-500 uppercase tracking-wide">{p.category.name}</p>
                      <p className="text-sm font-medium text-ink-800 line-clamp-1">{p.name}</p>
                      <p className="text-sm font-display italic text-lilac-600">{formatPrice(price)}</p>
                      {p.variants.length > 0 ? (
                        <div className="mt-2 h-12 overflow-y-auto pr-1 flex flex-wrap content-start gap-1">
                          {p.variants.map(v => (
                            <span
                              key={v.id}
                              onClick={(e) => { e.stopPropagation(); addToCart(p, v) }}
                              className="text-[10px] bg-lilac-50 text-lilac-700 hover:bg-lilac-500 hover:text-white px-2 py-0.5 rounded-full cursor-pointer transition-colors max-w-full truncate"
                            >
                              + {v.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 h-12">
                          <p className="text-[10px] text-ink-400 mt-1">Estoque: {p.stock}</p>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Direita — Carrinho */}
        <div>
          <div className="bg-white border border-ink-200 rounded-xl shadow-sm sticky top-24 flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {/* Cliente */}
            <div className="p-4 border-b border-ink-100">
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-lilac-50 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-lilac-600" />
                    <div>
                      <p className="font-medium text-ink-800 leading-tight">{selectedCustomer.name}</p>
                      <p className="text-xs text-ink-500">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="text-ink-400 hover:text-ink-600">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Cliente (busca opcional)"
                    className="w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm"
                  />
                  {customers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {customers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]) }}
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
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-ink-400 text-sm">
                  Carrinho vazio
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((it, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="w-12 h-14 bg-ink-50 rounded-md overflow-hidden flex-shrink-0">
                        {it.image ? <img src={it.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🌸</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-800 line-clamp-1">{it.name}</p>
                        {it.variantName && <p className="text-[10px] text-ink-500">{it.variantName}</p>}
                        <div className="flex items-center gap-1 mt-1">
                          <button onClick={() => updateQty(i, it.qty - 1)} className="w-5 h-5 rounded border border-ink-200"><Minus size={10} className="mx-auto" /></button>
                          <span className="text-xs font-semibold w-5 text-center">{it.qty}</span>
                          <button onClick={() => updateQty(i, it.qty + 1)} className="w-5 h-5 rounded border border-ink-200"><Plus size={10} className="mx-auto" /></button>
                          <button onClick={() => updateQty(i, 0)} className="ml-2 text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-ink-800">{formatPrice(it.price * it.qty)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-ink-100 space-y-3">
              {/* Pagamento */}
              <div className="grid grid-cols-3 gap-1">
                {PAYMENT_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPaymentMethod(p.value)}
                    className={`py-2 rounded-md text-xs font-semibold border-2 transition-all ${
                      paymentMethod === p.value ? 'border-lilac-500 bg-lilac-50 text-lilac-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
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

              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="Desconto (R$)"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountNum > 0 && (
                  <div className="flex justify-between text-green-600 text-xs">
                    <span>Desconto</span>
                    <span>-{formatPrice(discountNum)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-ink-800 pt-2 border-t border-ink-100">
                  <span>Total</span>
                  <span className="font-display italic">{formatPrice(total)}</span>
                </div>
              </div>

              <Button onClick={finalizeSale} disabled={submitting || cart.length === 0} className="w-full bg-lilac-500 hover:bg-lilac-600 py-5">
                {submitting ? 'Processando...' : 'Finalizar Venda'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {receipt && <SaleReceipt receipt={receipt} onClose={() => setReceipt(null)} />}
    </AdminLayout>
  )
}

function SaleReceipt({ receipt, onClose }: { receipt: any; onClose: () => void }) {
  const paymentLabel = receipt.paymentMethod === 'cash' ? 'Dinheiro' : receipt.paymentMethod === 'pix_pdv' ? 'PIX' : 'Cartão'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-transparent print:p-0">
      <div className="bg-white rounded-xl max-w-sm w-full flex flex-col max-h-[90vh] print:max-h-none print:max-w-none print:rounded-none print:shadow-none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-lilac-500" />
            <h3 className="font-semibold text-ink-800">Cupom Não-Fiscal</h3>
          </div>
          <button onClick={onClose} className="text-ink-400"><X size={18} /></button>
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
