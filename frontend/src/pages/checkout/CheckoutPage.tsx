import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CreditCardForm } from '@/components/features/CreditCardForm'
import { PixPayment } from '@/components/features/PixPayment'
import { AddressSelectorCards } from '@/components/checkout/AddressSelectorCards'
import { CardWalletSelector } from '@/components/checkout/CardWalletSelector'
import { useCartStore, selectTotal } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useCheckoutStore } from '@/store/checkoutStore'
import { useLoaderStore } from '@/store/loaderStore'
import { neighborhoodService, type City, type Neighborhood } from '@/services/neighborhoodService'
import { orderService } from '@/services/orderService'
import { api } from '@/lib/axios'
import { Store, Truck, ShoppingBag, CreditCard, CheckCircle } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

const STEPS = ['Identificação', 'Entrega', 'Resumo', 'Pagamento']

export function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, clearCart, coupon } = useCartStore()
  const cartTotal = useCartStore(selectTotal)
  
  // Checkout State (Persisted)
  const checkoutStore = useCheckoutStore()

  // Local state
  const [step, setStep] = useState<Step>(1)
  const [discountedItems, setDiscountedItems] = useState<any[]>([])
  const [totalPromoDiscount, setTotalPromoDiscount] = useState(0)
  
  // Delivery State
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null)
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)

  useEffect(() => {
    neighborhoodService.getCities().then(setCities)
    calculatePromotions()
  }, [])

  // Auto-fill logged in user data and skip Step 1
  useEffect(() => {
    if (user) {
      if (!checkoutStore.email) checkoutStore.setField('email', user.email)
      if (!checkoutStore.name) checkoutStore.setField('name', user.name)
      if (!checkoutStore.phone && user.phone) checkoutStore.setField('phone', user.phone)
      // Skip Step 1 for logged-in users
      if (step === 1) {
        setStep(2)
      }
    }
  }, [user])

  // Try to load neighborhood if already in store
  useEffect(() => {
    if (checkoutStore.neighborhoodId && neighborhoods.length > 0) {
      const match = neighborhoods.find(n => n.id === Number(checkoutStore.neighborhoodId))
      if (match) setSelectedNeighborhood(match)
    }
  }, [neighborhoods, checkoutStore.neighborhoodId])

  const calculatePromotions = async () => {
    try {
      const res = await api.post('/discounts/calculate', { items })
      setDiscountedItems(res.data.items)
      setTotalPromoDiscount(res.data.totalPromotionDiscount)
    } catch (err) {
      setDiscountedItems(items)
      setTotalPromoDiscount(0)
    }
  }

  const handleCepSearch = async () => {
    const cep = checkoutStore.cep.replace(/\D/g, '')
    if (cep.length !== 8) { setCepError('CEP deve ter 8 dígitos'); return }
    setCepLoading(true)
    setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) { setCepError('CEP não encontrado'); return }

      checkoutStore.setField('address', data.logradouro)
      
      const match = cities.find(c =>
        c.name.toLowerCase() === data.localidade.toLowerCase() &&
        c.state.toLowerCase() === data.uf.toLowerCase()
      )

      if (match) {
        const nbhs = await neighborhoodService.getNeighborhoods(match.id)
        setNeighborhoods(nbhs)
      } else {
        setNeighborhoods([])
        setSelectedNeighborhood(null)
      }
    } catch {
      setCepError('Erro ao buscar CEP.')
    } finally {
      setCepLoading(false)
    }
  }

  const handleAddressSelected = async (addressId: number, address: { neighborhood: string; city: string; state: string }) => {
    checkoutStore.setSelectedAddressId(addressId)

    const matchCity = cities.find(c =>
      c.name.toLowerCase() === address.city.toLowerCase() &&
      c.state.toLowerCase() === address.state.toLowerCase()
    )

    if (matchCity) {
      const nbhs = await neighborhoodService.getNeighborhoods(matchCity.id)
      setNeighborhoods(nbhs)
      const match = nbhs.find(n =>
        address.neighborhood.toLowerCase().includes(n.name.toLowerCase()) ||
        n.name.toLowerCase().includes(address.neighborhood.toLowerCase())
      )
      setSelectedNeighborhood(match ?? null)
    } else {
      setNeighborhoods([])
      setSelectedNeighborhood(null)
    }
  }

  const handleCreateOrder = async (method: 'pix' | 'card', token?: string, methodId?: string) => {
    if (checkoutStore.deliveryMethod === 'motoboy' && !selectedNeighborhood) {
      alert('Selecione um bairro para a entrega.')
      return
    }
    
    setSubmitting(true)
    useLoaderStore.getState().show('Finalizando pedido...')
    try {
      const order = await orderService.create({
        items: items.map(i => ({ productId: Number(i.productId), variantId: i.variantId ? Number(i.variantId) : null, qty: Number(i.qty), price: Number(i.price) })),
        neighborhoodId: checkoutStore.deliveryMethod === 'motoboy' ? selectedNeighborhood!.id : undefined,
        deliveryMethod: checkoutStore.deliveryMethod,
        deliveryMessage: checkoutStore.deliveryMessage || undefined,
        customerName: checkoutStore.name,
        customerEmail: checkoutStore.email,
        customerPhone: checkoutStore.phone || undefined,
        cpf: checkoutStore.cpf,
        cardToken: token,
        paymentMethodId: methodId,
        installments: 1,
        couponId: coupon?.id,
        discount: totalPromoDiscount + couponDiscountValue,
        paymentMethod: method,
        isTestMode
      })

      if (method === 'pix' && !isTestMode) {
        setOrderId(order.id)
        setStep(5)
      } else {
        checkoutStore.reset()
        clearCart()
        navigate(`/pedido/${order.id}`)
      }
    } catch (error: any) {
      alert('Erro ao processar pedido: ' + (error.response?.data?.error || error.message))
      setSubmitting(false)
    } finally {
      useLoaderStore.getState().hide()
    }
  }

  const handlePixSuccess = () => {
    checkoutStore.reset()
    clearCart()
    navigate(`/pedido/${orderId}`)
  }

  // Cálculos de Totais
  const deliveryFee = checkoutStore.deliveryMethod === 'motoboy' && selectedNeighborhood ? Number(selectedNeighborhood.deliveryFee) : 0
  const subtotalWithPromos = cartTotal - totalPromoDiscount
  const couponDiscountValue = coupon
    ? (coupon.discountType === 'percentage' ? subtotalWithPromos * (coupon.discountValue / 100) : coupon.discountValue)
    : 0
  const totalDiscounts = totalPromoDiscount + couponDiscountValue
  const grandTotal = Math.max(0, cartTotal - totalDiscounts + deliveryFee)

  if (items.length === 0 && !orderId) {
    return (
      <Layout>
        <div className="container mx-auto px-5 py-20 text-center max-w-xl">
          <ShoppingBag size={48} className="mx-auto text-ink-200 mb-6" />
          <h1 className="text-3xl font-display text-ink-800 mb-6">Carrinho Vazio</h1>
          <Button onClick={() => navigate('/loja')} className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill px-8">Voltar à loja</Button>
        </div>
      </Layout>
    )
  }

  const isStep1Valid = checkoutStore.name && checkoutStore.email && checkoutStore.cpf.length >= 11
  const isStep2Valid = checkoutStore.deliveryMethod === 'retirada' || (checkoutStore.cep && checkoutStore.addressNumber && selectedNeighborhood)

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-5 py-10">

        {/* Progress Tracker */}
        {step < 5 && (
          <div className="flex items-center justify-between mb-10 pb-2">
            {STEPS.map((label, i) => {
              const currentStep = i + 1
              const active = currentStep === step
              const done = currentStep < step

              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex flex-col sm:flex-row items-center gap-2 transition-all duration-300 ${active ? 'text-ink-800' : done ? 'text-lilac-500' : 'text-ink-300'}`}>
                    <div className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      active
                        ? 'bg-ink-800 text-white ring-4 ring-ink-800/20 scale-110'
                        : done
                        ? 'bg-lilac-500 text-white'
                        : 'bg-ink-100 text-ink-400'
                    }`}>
                      {done ? <CheckCircle size={14} /> : currentStep}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-center sm:text-left transition-all duration-300 ${active ? 'text-ink-800' : ''}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 sm:mx-4 hidden sm:block transition-all duration-500 ${done ? 'bg-lilac-500' : 'bg-ink-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Layout 2 colunas: steps + resumo lateral */}
        <div className={`grid gap-8 ${step < 5 ? 'grid-cols-1 lg:grid-cols-[1fr_340px]' : ''}`}>
        <div>

        {/* Step 1 — Identificação (Skip for logged-in users) */}
        {!user && step === 1 && (
          <div className="bg-white border border-ink-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Sua Identificação</h2>
            {!user && (
              <div className="bg-lilac-50 border border-lilac-100 rounded-lg p-4 mb-6 flex justify-between items-center text-sm">
                <span className="text-lilac-800">Já tem uma conta?</span>
                <Button variant="outline" size="sm" className="bg-white" onClick={() => navigate('/login')}>Fazer Login</Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Nome completo</label>
                <Input value={checkoutStore.name} onChange={e => checkoutStore.setField('name', e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">E-mail</label>
                <Input type="email" value={checkoutStore.email} onChange={e => checkoutStore.setField('email', e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CPF</label>
                <Input value={checkoutStore.cpf} onChange={e => checkoutStore.setField('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="Apenas números" maxLength={11} required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Telefone (opcional)</label>
                <Input value={checkoutStore.phone} onChange={e => checkoutStore.setField('phone', e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill px-8" disabled={!isStep1Valid} onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          </div>
        )}


        {/* Step 2 — Entrega */}
        {step === 2 && (
          <div className="bg-white border border-ink-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Como você quer receber?</h2>

            {/* For logged-in users with saved addresses, use AddressSelectorCards */}
            {user ? (
              <div>
                <AddressSelectorCards
                  selectedAddressId={checkoutStore.selectedAddressId}
                  onSelectAddress={handleAddressSelected}
                />

                {/* Bairro auto-resolvido → mostrar frete */}
                {selectedNeighborhood && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
                    <span>✓ Entrega para <strong>{selectedNeighborhood.name}</strong>:</span>
                    <span className="font-semibold">{formatPrice(Number(selectedNeighborhood.deliveryFee))}</span>
                  </div>
                )}

                {/* Bairro não resolvido mas cidade encontrada → seletor manual */}
                {neighborhoods.length > 0 && !selectedNeighborhood && checkoutStore.selectedAddressId && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-800 mb-2">
                      Seu bairro não foi reconhecido automaticamente. Selecione o bairro de entrega:
                    </p>
                    <select
                      className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm bg-white"
                      value=""
                      onChange={e => {
                        setSelectedNeighborhood(neighborhoods.find(n => n.id === Number(e.target.value)) ?? null)
                      }}
                    >
                      <option value="">Selecione o bairro...</option>
                      {neighborhoods.map(n => (
                        <option key={n.id} value={n.id}>{n.name} — {formatPrice(Number(n.deliveryFee))}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cidade não cadastrada → aviso */}
                {checkoutStore.selectedAddressId && neighborhoods.length === 0 && !selectedNeighborhood && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    ⚠️ Cidade do endereço não está na área de entrega. Tente retirar na loja ou use outro endereço.
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(1)}>Voltar</Button>
                  <Button
                    className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill px-8"
                    disabled={!checkoutStore.selectedAddressId || !selectedNeighborhood}
                    onClick={() => setStep(3)}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            ) : (
              /* Original CEP-based flow for anonymous users */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => checkoutStore.setField('deliveryMethod', 'motoboy')}
                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left ${checkoutStore.deliveryMethod === 'motoboy' ? 'border-lilac-500 bg-lilac-50' : 'border-ink-200 hover:border-ink-300'}`}
                  >
                    <Truck className={checkoutStore.deliveryMethod === 'motoboy' ? 'text-lilac-600' : 'text-ink-400'} />
                    <div>
                      <p className={`font-semibold text-sm ${checkoutStore.deliveryMethod === 'motoboy' ? 'text-lilac-800' : 'text-ink-700'}`}>Entrega Local</p>
                      <p className="text-xs text-ink-500 mt-1">Receba em casa via motoboy. Taxa calculada por bairro.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => checkoutStore.setField('deliveryMethod', 'retirada')}
                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left ${checkoutStore.deliveryMethod === 'retirada' ? 'border-lilac-500 bg-lilac-50' : 'border-ink-200 hover:border-ink-300'}`}
                  >
                    <Store className={checkoutStore.deliveryMethod === 'retirada' ? 'text-lilac-600' : 'text-ink-400'} />
                    <div>
                      <p className={`font-semibold text-sm ${checkoutStore.deliveryMethod === 'retirada' ? 'text-lilac-800' : 'text-ink-700'}`}>Retirar na Loja</p>
                      <p className="text-xs text-ink-500 mt-1">Grátis. Retire seu pedido no nosso ateliê físico.</p>
                    </div>
                  </button>
                </div>

                {checkoutStore.deliveryMethod === 'retirada' ? (
                  <div className="bg-ink-50 border border-ink-200 rounded-lg p-5 text-sm text-ink-700 mb-6">
                    <p className="font-semibold mb-2">📍 Endereço de Retirada:</p>
                    <p>Rua das Flores, 123 - Centro</p>
                    <p>São Paulo / SP</p>
                    <p className="text-xs text-ink-500 mt-2">Aguarde a confirmação por e-mail ou WhatsApp para buscar o pedido.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CEP</label>
                        <Input value={checkoutStore.cep} onChange={e => checkoutStore.setField('cep', e.target.value.replace(/\D/g, '').slice(0,8))} placeholder="00000000" />
                      </div>
                      <div className="flex items-end">
                        <Button className="bg-ink-800 hover:bg-lilac-500 text-white" onClick={handleCepSearch} disabled={cepLoading || checkoutStore.cep.length < 8}>
                          {cepLoading ? '...' : 'Buscar'}
                        </Button>
                      </div>
                    </div>
                    {cepError && <p className="text-xs text-red-500">{cepError}</p>}

                    {neighborhoods.length > 0 && (
                      <div className="bg-ink-50 p-4 rounded-lg border border-ink-100 space-y-4">
                        <div>
                          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Rua</label>
                          <Input value={checkoutStore.address} onChange={e => checkoutStore.setField('address', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Número</label>
                            <Input value={checkoutStore.addressNumber} onChange={e => checkoutStore.setField('addressNumber', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Complemento</label>
                            <Input value={checkoutStore.complement} onChange={e => checkoutStore.setField('complement', e.target.value)} placeholder="Apto 45" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Bairro de Entrega</label>
                          <select
                            className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-800 bg-white"
                            value={checkoutStore.neighborhoodId}
                            onChange={e => {
                              checkoutStore.setField('neighborhoodId', e.target.value)
                              setSelectedNeighborhood(neighborhoods.find(n => n.id === Number(e.target.value)) ?? null)
                            }}
                          >
                            <option value="">Selecione o bairro validado...</option>
                            {neighborhoods.map(n => (
                              <option key={n.id} value={n.id}>{n.name} — {formatPrice(Number(n.deliveryFee))}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(1)}>Voltar</Button>
                  <Button className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill px-8" disabled={!isStep2Valid} onClick={() => setStep(3)}>
                    Continuar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Resumo e Mensagem */}
        {step === 3 && (
          <div className="bg-white border border-ink-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Revisão do Pedido</h2>
            
            <div className="mb-6">
              <label className="text-xs font-semibold uppercase text-ink-500 mb-2 block">Mensagem para presente (Opcional)</label>
              <Textarea 
                value={checkoutStore.deliveryMessage} 
                onChange={e => checkoutStore.setField('deliveryMessage', e.target.value.slice(0, 150))} 
                placeholder="Escreva algo especial..." 
                className="h-20 resize-none text-sm" 
              />
            </div>

            <div className="bg-ink-50 rounded-lg p-5 border border-ink-200">
              <div className="divide-y divide-ink-200 mb-4 border-b border-ink-200">
                {discountedItems.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="py-3 flex justify-between text-sm items-center">
                    <div>
                      <span className="font-medium text-ink-800">{item.productName}</span>
                      <span className="text-ink-500 ml-2">x{item.qty}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-ink-800">{formatPrice((item.discountedPrice || item.price) * item.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm text-ink-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descontos</span>
                    <span>-{formatPrice(totalDiscounts)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frete ({checkoutStore.deliveryMethod === 'retirada' ? 'Retirada' : selectedNeighborhood?.name})</span>
                  <span>{checkoutStore.deliveryMethod === 'retirada' ? 'Grátis' : formatPrice(deliveryFee)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-ink-200">
                <span className="text-lg font-semibold text-ink-800">Total a Pagar</span>
                <span className="font-display italic text-2xl text-ink-900">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(2)}>Voltar</Button>
              <Button className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill px-8" onClick={() => setStep(4)}>
                Ir para Pagamento
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Pagamento */}
        {step === 4 && (
          <div className="bg-white border border-ink-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Como você quer pagar?</h2>
            
            <div className="flex gap-4 mb-8">
              <button
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'pix' ? 'border-lilac-500 bg-lilac-50 text-lilac-700' : 'border-ink-200 hover:border-ink-300 text-ink-600'}`}
                onClick={() => setPaymentMethod('pix')}
              >
                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">❖</div>
                <span className="font-semibold text-sm">PIX</span>
              </button>
              <button
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'card' ? 'border-lilac-500 bg-lilac-50 text-lilac-700' : 'border-ink-200 hover:border-ink-300 text-ink-600'}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={24} />
                <span className="font-semibold text-sm">Cartão de Crédito</span>
              </button>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="testMode" 
                className="w-4 h-4 accent-ink-800"
                checked={isTestMode}
                onChange={e => setIsTestMode(e.target.checked)}
              />
              <label htmlFor="testMode" className="text-sm font-semibold text-ink-700 cursor-pointer">
                Ativar Modo de Teste (Pular Gateway de Pagamento)
              </label>
            </div>

            {paymentMethod === 'pix' ? (
              <div className="space-y-6">
                <div className="bg-teal-50 text-teal-800 p-4 rounded-lg text-sm text-center border border-teal-100">
                  <p className="font-semibold mb-1">Aprovação Imediata!</p>
                  <p>O QR Code para pagamento será gerado assim que você confirmar o pedido.</p>
                </div>
                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(3)} disabled={submitting}>Voltar</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-pill px-8" onClick={() => handleCreateOrder('pix')} disabled={submitting}>
                    {submitting ? 'Gerando...' : 'Confirmar Pedido com PIX'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {user ? (
                  <>
                    <CardWalletSelector
                      selectedCardId={checkoutStore.selectedCardId}
                      onSelectCard={(id) => checkoutStore.setSelectedCardId(id)}
                    />
                    <div className="flex gap-3 justify-end mt-8">
                      <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(3)} disabled={submitting}>Voltar</Button>
                      <Button className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill px-8" disabled={!checkoutStore.selectedCardId || submitting} onClick={() => handleCreateOrder('card')} >
                        {submitting ? 'Processando...' : 'Confirmar Pedido'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <CreditCardForm onTokenCreated={(token, id) => handleCreateOrder('card', token, id)} isLoading={submitting} />
                    <div className="flex justify-start mt-4">
                      <Button variant="ghost" className="text-sm text-ink-500" onClick={() => setStep(3)} disabled={submitting}>Voltar</Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5 — PIX Aguardando */}
        {step === 5 && orderId && (
          <PixPayment
            orderId={orderId}
            customerEmail={checkoutStore.email}
            cpf={checkoutStore.cpf}
            onSuccess={handlePixSuccess}
          />
        )}

        </div>{/* fim coluna principal */}

        {/* Resumo lateral — visível em todos os steps < 5 */}
        {step < 5 && (
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-white border border-ink-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-ink-800 text-sm">Resumo do Pedido</h3>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(discountedItems.length > 0 ? discountedItems : items).map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 items-center">
                    <div className="w-10 h-12 rounded-md overflow-hidden flex-shrink-0 bg-ink-50">
                      {item.productImages ? (
                        <img src={item.productImages} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base">🌸</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-ink-500">{item.variantName || 'Único'} × {item.qty}</p>
                    </div>
                    <p className="text-xs font-semibold text-ink-800 flex-shrink-0">
                      {formatPrice((item.discountedPrice || item.price) * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-ink-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descontos</span>
                    <span>-{formatPrice(totalDiscounts)}</span>
                  </div>
                )}
                {selectedNeighborhood && (
                  <div className="flex justify-between text-ink-500">
                    <span>Frete</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-ink-800 pt-2 border-t border-ink-100 text-base">
                  <span>Total</span>
                  <span className="font-display italic">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>{/* fim grid 2 colunas */}

      </div>
    </Layout>
  )
}
