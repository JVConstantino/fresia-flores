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
import { HospitalDeliveryNotice } from '@/components/checkout/HospitalDeliveryNotice'
import { looksLikeHospital } from '@/lib/hospitalKeywords'
import { useCartStore, selectTotal } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useCheckoutStore } from '@/store/checkoutStore'
import { useLoaderStore } from '@/store/loaderStore'
import { neighborhoodService, type City, type Neighborhood } from '@/services/neighborhoodService'
import { orderService } from '@/services/orderService'
import { api } from '@/lib/axios'
import { Store, Truck, ShoppingBag, CreditCard } from 'lucide-react'

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
  
  // Inline Login States
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { setUser } = useAuthStore()

  const handleInlineLogin = async () => {
    setLoginError('')
    setLoginLoading(true)
    try {
      const { authService } = await import('@/services/authService')
      const loggedUser = await authService.login(loginEmail, loginPassword)
      setUser(loggedUser)
      checkoutStore.setField('email', loggedUser.email)
      checkoutStore.setField('name', loggedUser.name)
      if (loggedUser.phone) checkoutStore.setField('phone', loggedUser.phone)
      setStep(2)
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Email ou senha incorretos.')
    } finally {
      setLoginLoading(false)
    }
  }
  
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
      checkoutStore.setField('bairroText', data.bairro || '')
      checkoutStore.setField('cityText', data.localidade || '')
      checkoutStore.setField('stateText', data.uf || '')
      
      const match = cities.find(c =>
        c.name.toLowerCase() === data.localidade.toLowerCase() &&
        c.state.toLowerCase() === data.uf.toLowerCase()
      )

      if (match) {
        const nbhs = await neighborhoodService.getNeighborhoods(match.id)
        setNeighborhoods(nbhs)
        
        // Auto-select matching neighborhood
        if (data.bairro && nbhs.length > 0) {
          const matched = nbhs.find(n =>
            n.name.toLowerCase() === data.bairro.toLowerCase() ||
            data.bairro.toLowerCase().includes(n.name.toLowerCase()) ||
            n.name.toLowerCase().includes(data.bairro.toLowerCase())
          )
          if (matched) {
            setSelectedNeighborhood(matched)
            checkoutStore.setField('neighborhoodId', matched.id.toString())
            checkoutStore.setField('deliveryMethod', 'motoboy')
          } else {
            setSelectedNeighborhood(null)
            checkoutStore.setField('neighborhoodId', '')
            // Out of delivery zone -> switch to WhatsApp Quote
            checkoutStore.setField('deliveryMethod', 'whatsapp_quote')
          }
        }
      } else {
        setNeighborhoods([])
        setSelectedNeighborhood(null)
        checkoutStore.setField('neighborhoodId', '')
        // Out of delivery zone -> switch to WhatsApp Quote
        checkoutStore.setField('deliveryMethod', 'whatsapp_quote')
      }
    } catch {
      setCepError('Erro ao buscar CEP.')
    } finally {
      setCepLoading(false)
    }
  }

  const handleAddressSelected = async (addressId: number, address: any) => {
    checkoutStore.setSelectedAddressId(addressId)
    checkoutStore.setField('address', address.street || '')
    checkoutStore.setField('addressNumber', address.number || '')
    checkoutStore.setField('complement', address.complement || '')
    checkoutStore.setField('cep', address.zipCode || '')
    checkoutStore.setField('bairroText', address.neighborhood || '')
    checkoutStore.setField('cityText', address.city || '')
    checkoutStore.setField('stateText', address.state || '')

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
      if (match) {
        setSelectedNeighborhood(match)
        checkoutStore.setField('deliveryMethod', 'motoboy')
      } else {
        setSelectedNeighborhood(null)
        checkoutStore.setField('deliveryMethod', 'whatsapp_quote')
      }
    } else {
      setNeighborhoods([])
      setSelectedNeighborhood(null)
      checkoutStore.setField('deliveryMethod', 'whatsapp_quote')
    }
  }

  const handleCreateOrder = async (method: 'pix' | 'card' | 'whatsapp', token?: string, methodId?: string) => {
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
        paymentMethod: method === 'whatsapp' ? 'pix' : method,
        isTestMode: method === 'whatsapp' ? false : isTestMode,
        // Address fields
        street: checkoutStore.address || undefined,
        number: checkoutStore.addressNumber || undefined,
        complement: checkoutStore.complement || undefined,
        zipCode: checkoutStore.cep || undefined,
        neighborhoodName: selectedNeighborhood?.name || checkoutStore.bairroText || undefined,
        city: checkoutStore.cityText || undefined,
        state: checkoutStore.stateText || undefined,
      })

      if (method === 'whatsapp') {
        const itemsList = items.map(i => `• ${i.productName} (x${i.qty})`).join('\n')
        const addressText = checkoutStore.deliveryMethod === 'retirada'
          ? 'Retirada no ateliê físico'
          : `- *Rua:* ${checkoutStore.address}\n- *Número:* ${checkoutStore.addressNumber}${checkoutStore.complement ? ` (${checkoutStore.complement})` : ''}\n- *Bairro:* ${selectedNeighborhood?.name || checkoutStore.bairroText || ''}\n- *Cidade/UF:* ${checkoutStore.cityText || ''} - ${checkoutStore.stateText || ''}\n- *CEP:* ${checkoutStore.cep}`
        
        const messageText = `🌸 *NOVO PEDIDO DE ORÇAMENTO - FRÉSIA FLORES* 🌸\n\nOlá! Registrei o pedido *#${order.id}* no site e gostaria de orçar o valor do frete para entrega.\n\n🛒 *Itens do Pedido:*\n${itemsList}\n\n📍 *Endereço de Entrega:*\n${addressText}\n\nPor favor, envie-me o valor combinado do frete para que eu possa prosseguir com o pagamento. Obrigado!`
        const encoded = encodeURIComponent(messageText)
        const whatsappUrl = `https://wa.me/5522999206935?text=${encoded}`

        checkoutStore.reset()
        clearCart()
        window.open(whatsappUrl, '_blank')
        navigate(`/pedido/${order.id}/detalhes`)
      } else if (method === 'pix' && !isTestMode) {
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
  const isStep2Valid = checkoutStore.deliveryMethod === 'retirada' ||
                       (checkoutStore.deliveryMethod === 'whatsapp_quote' && checkoutStore.cep && checkoutStore.addressNumber && checkoutStore.address) ||
                       (checkoutStore.deliveryMethod === 'motoboy' && checkoutStore.cep && checkoutStore.addressNumber && selectedNeighborhood)

  // Aviso de entrega em hospital: detecta palavras-chave no endereço informado
  const isHospitalAddress = looksLikeHospital(
    `${checkoutStore.address} ${checkoutStore.complement} ${selectedNeighborhood?.name ?? ''}`
  )

  // Helper: delivery method display name
  const deliveryMethodLabel = checkoutStore.deliveryMethod === 'retirada'
    ? 'Retirada na Loja'
    : checkoutStore.deliveryMethod === 'whatsapp_quote'
    ? 'Orçamento WhatsApp'
    : selectedNeighborhood?.name ?? 'Entrega Local'

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-5 py-10 relative">
        {/* Background soft glowing accent */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-lilac-200/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-petal-200/5 rounded-full blur-3xl pointer-events-none" />

        {/* Progress Tracker */}
        {step < 5 && (
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-ink-200/40 relative">
            {STEPS.map((label, i) => {
              const currentStep = i + 1
              const active = currentStep === step
              const done = currentStep < step

              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex flex-col sm:flex-row items-center gap-2.5 transition-all duration-300 ${active ? 'text-ink-900' : done ? 'text-lilac-500' : 'text-ink-400'}`}>
                    <div className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-300 ${
                      active
                        ? 'border-lilac-500 bg-lilac-50/50 text-lilac-600 ring-4 ring-lilac-500/15 scale-105'
                        : done
                        ? 'border-green-500 bg-green-50/50 text-green-600'
                        : 'border-ink-200 bg-white/50 text-ink-400'
                    }`}>
                      {done ? '✓' : `0${currentStep}`}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-center sm:text-left transition-all duration-300 ${active ? 'text-ink-900' : ''}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-[1px] mx-3 sm:mx-6 hidden sm:block transition-all duration-500 ${done ? 'bg-lilac-400' : 'bg-ink-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Layout 2 colunas: steps + resumo lateral */}
        <div className={`grid gap-8 ${step < 5 ? 'grid-cols-1 lg:grid-cols-[1fr_340px]' : ''} relative`}>
        <div>

        {/* Step 1 — Identificação (Skip for logged-in users) */}
        {!user && step === 1 && (
          <div className="bg-white/80 border border-ink-200/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] backdrop-blur-md">
            <h2 className="font-display italic text-2xl text-ink-900 mb-6">Sua Identificação</h2>
            
            {/* Inline Login Toggle / Form */}
            {isLoggingIn ? (
              <div className="bg-lilac-50/40 border border-lilac-100/60 rounded-xl p-5 mb-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-lilac-200/40">
                  <h3 className="font-bold text-lilac-800 text-[11px] uppercase tracking-wider">Fazer Login</h3>
                  <button onClick={() => setIsLoggingIn(false)} className="text-xs text-lilac-600 hover:text-lilac-800 underline underline-offset-2">Quero me identificar sem login</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-1.5">Email</label>
                    <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="seu@email.com" className="rounded-xl border-ink-200 focus-visible:ring-lilac-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-1.5">Senha</label>
                    <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="rounded-xl border-ink-200 focus-visible:ring-lilac-500/20" />
                  </div>
                </div>
                {loginError && (
                  <p className="text-xs text-red-500 font-semibold">{loginError}</p>
                )}
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleInlineLogin} 
                    disabled={loginLoading || !loginEmail || !loginPassword}
                    className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-full px-6 font-semibold text-xs uppercase tracking-wider"
                  >
                    {loginLoading ? 'Carregando...' : 'Entrar e Continuar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-lilac-50/30 border border-lilac-100/50 rounded-xl p-4 mb-6 flex justify-between items-center text-sm">
                <span className="text-lilac-800 font-medium">Já tem uma conta?</span>
                <Button variant="outline" size="sm" className="bg-white rounded-full border-lilac-200 text-lilac-700 hover:bg-lilac-50 font-semibold" onClick={() => setIsLoggingIn(true)}>Fazer Login</Button>
              </div>
            )}

            {!isLoggingIn && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-1.5 block">Nome completo</label>
                    <Input value={checkoutStore.name} onChange={e => checkoutStore.setField('name', e.target.value)} className="rounded-xl border-ink-200 focus-visible:ring-lilac-500/20" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-1.5 block">E-mail</label>
                    <Input type="email" value={checkoutStore.email} onChange={e => checkoutStore.setField('email', e.target.value)} className="rounded-xl border-ink-200 focus-visible:ring-lilac-500/20" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-1.5 block">CPF</label>
                    <Input value={checkoutStore.cpf} onChange={e => checkoutStore.setField('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="Apenas números" maxLength={11} className="rounded-xl border-ink-200 focus-visible:ring-lilac-500/20 font-mono tracking-wide" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-1.5 block">Telefone (opcional)</label>
                    <Input value={checkoutStore.phone} onChange={e => checkoutStore.setField('phone', e.target.value)} placeholder="(11) 99999-9999" className="rounded-xl border-ink-200 focus-visible:ring-lilac-500/20" />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button className="bg-ink-900 hover:bg-lilac-500 text-white rounded-full px-8 font-bold text-xs uppercase tracking-wider transition-colors" disabled={!isStep1Valid} onClick={() => setStep(2)}>
                    Continuar
                  </Button>
                </div>
              </>
            )}
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

                {isHospitalAddress && <HospitalDeliveryNotice />}

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
                        const nb = neighborhoods.find(n => n.id === Number(e.target.value))
                        setSelectedNeighborhood(nb ?? null)
                        if (nb) {
                          checkoutStore.setField('neighborhoodId', nb.id.toString())
                          checkoutStore.setField('deliveryMethod', 'motoboy')
                        }
                      }}
                    >
                      <option value="">Selecione o bairro...</option>
                      {neighborhoods.map(n => (
                        <option key={n.id} value={n.id}>{n.name} — {formatPrice(Number(n.deliveryFee))}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cidade não cadastrada → aviso WhatsApp Quote */}
                {checkoutStore.selectedAddressId && neighborhoods.length === 0 && !selectedNeighborhood && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    ⚠️ Sua cidade/bairro não está na área de entrega padrão. Ao finalizar, você poderá solicitar um orçamento de frete pelo WhatsApp.
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(1)}>Voltar</Button>
                  <Button
                    className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill px-8"
                    disabled={!checkoutStore.selectedAddressId || (!selectedNeighborhood && checkoutStore.deliveryMethod === 'motoboy')}
                    onClick={() => setStep(3)}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            ) : (
              /* Guest flow: CEP-based delivery with method selector */
              <>
                {/* Delivery method cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => checkoutStore.setField('deliveryMethod', 'motoboy')}
                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left ${checkoutStore.deliveryMethod === 'motoboy' ? 'border-lilac-500 bg-lilac-50' : 'border-ink-200 hover:border-ink-300'}`}
                  >
                    <Truck className={checkoutStore.deliveryMethod === 'motoboy' ? 'text-lilac-600' : 'text-ink-400'} />
                    <div>
                      <p className={`font-semibold text-sm ${checkoutStore.deliveryMethod === 'motoboy' ? 'text-lilac-800' : 'text-ink-700'}`}>Entrega Local</p>
                      <p className="text-xs text-ink-500 mt-1">Motoboy expresso. Taxa por bairro.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => checkoutStore.setField('deliveryMethod', 'retirada')}
                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left ${checkoutStore.deliveryMethod === 'retirada' ? 'border-lilac-500 bg-lilac-50' : 'border-ink-200 hover:border-ink-300'}`}
                  >
                    <Store className={checkoutStore.deliveryMethod === 'retirada' ? 'text-lilac-600' : 'text-ink-400'} />
                    <div>
                      <p className={`font-semibold text-sm ${checkoutStore.deliveryMethod === 'retirada' ? 'text-lilac-800' : 'text-ink-700'}`}>Retirar na Loja</p>
                      <p className="text-xs text-ink-500 mt-1">Grátis. Retire no nosso ateliê físico.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => checkoutStore.setField('deliveryMethod', 'whatsapp_quote')}
                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left ${checkoutStore.deliveryMethod === 'whatsapp_quote' ? 'border-lilac-500 bg-lilac-50' : 'border-ink-200 hover:border-ink-300'}`}
                  >
                    <span className="text-xl">💬</span>
                    <div>
                      <p className={`font-semibold text-sm ${checkoutStore.deliveryMethod === 'whatsapp_quote' ? 'text-lilac-800' : 'text-ink-700'}`}>Orçar no WhatsApp</p>
                      <p className="text-xs text-ink-500 mt-1">Fora da área padrão. Cotação manual.</p>
                    </div>
                  </button>
                </div>

                {/* WhatsApp Quote notice */}
                {checkoutStore.deliveryMethod === 'whatsapp_quote' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-lg mb-4">
                    ⚠️ <strong>Entrega com frete personalizado:</strong> Seu CEP não possui cálculo automático. Informe os dados do endereço de entrega abaixo. Ao finalizar, você enviará o pedido para orçamento no WhatsApp.
                  </div>
                )}

                {/* CEP search (only for delivery methods, not retirada) */}
                {checkoutStore.deliveryMethod !== 'retirada' && (
                  <div className="space-y-4">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CEP</label>
                        <Input
                          value={checkoutStore.cep}
                          onChange={e => checkoutStore.setField('cep', e.target.value.replace(/\D/g, '').slice(0, 8))}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="h-10 px-6"
                        onClick={handleCepSearch}
                        disabled={cepLoading}
                      >
                        {cepLoading ? 'Buscando...' : 'Buscar'}
                      </Button>
                    </div>
                    {cepError && <p className="text-xs text-red-500">{cepError}</p>}

                    {/* Address fields (shown after CEP search fills them, or for whatsapp_quote) */}
                    {(checkoutStore.address || checkoutStore.deliveryMethod === 'whatsapp_quote') && (
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

                        {isHospitalAddress && <HospitalDeliveryNotice />}
                        
                        {/* Neighborhood selector for motoboy */}
                        {checkoutStore.deliveryMethod === 'motoboy' && neighborhoods.length > 0 && (
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
                        )}

                        {/* Auto-resolved neighborhood display */}
                        {checkoutStore.deliveryMethod === 'motoboy' && selectedNeighborhood && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
                            <span>✓ Entrega para <strong>{selectedNeighborhood.name}</strong>:</span>
                            <span className="font-semibold">{formatPrice(Number(selectedNeighborhood.deliveryFee))}</span>
                          </div>
                        )}

                        {/* WhatsApp quote extra fields */}
                        {checkoutStore.deliveryMethod === 'whatsapp_quote' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Bairro</label>
                              <Input
                                value={checkoutStore.bairroText}
                                onChange={e => checkoutStore.setField('bairroText', e.target.value)}
                                placeholder="Bairro para entrega..."
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Cidade</label>
                              <Input
                                value={checkoutStore.cityText}
                                onChange={e => checkoutStore.setField('cityText', e.target.value)}
                                placeholder="Cidade"
                              />
                            </div>
                          </div>
                        )}
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
                  <span>Frete ({deliveryMethodLabel})</span>
                  <span>
                    {checkoutStore.deliveryMethod === 'retirada'
                      ? 'Grátis'
                      : checkoutStore.deliveryMethod === 'whatsapp_quote'
                      ? 'A combinar'
                      : formatPrice(deliveryFee)}
                  </span>
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
            
            {checkoutStore.deliveryMethod === 'whatsapp_quote' ? (
              /* WhatsApp Quote flow — no payment selection, just send to WhatsApp */
              <div className="space-y-6">
                <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-200 leading-relaxed">
                  <p className="font-semibold mb-1">Cotação do Frete pelo WhatsApp</p>
                  <p>Seu pedido será registrado e você será redirecionado para falar com nossa vendedora no WhatsApp para combinar o valor da entrega. Assim que o valor for adicionado, você poderá realizar o pagamento na página do seu pedido.</p>
                </div>
                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="outline" className="rounded-pill px-8" onClick={() => setStep(3)} disabled={submitting}>Voltar</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-pill px-8 gap-2 font-semibold" onClick={() => handleCreateOrder('whatsapp')} disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Orçar Entrega no WhatsApp 💬'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal payment flow */
              <>
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
              </>
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
                {checkoutStore.deliveryMethod === 'whatsapp_quote' && (
                  <div className="flex justify-between text-ink-500">
                    <span>Frete</span>
                    <span className="text-amber-600 font-medium">A combinar</span>
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
