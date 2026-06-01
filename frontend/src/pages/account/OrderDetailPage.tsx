import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, Truck, Package, XCircle, MapPin, CreditCard, MessageSquare, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PixPayment } from '@/components/features/PixPayment'
import { CreditCardForm } from '@/components/features/CreditCardForm'
import { api } from '@/lib/axios'
import { useLoaderEffect } from '@/hooks/useLoaderEffect'
import { useLoaderStore } from '@/store/loaderStore'

interface OrderDetail {
  id: number
  status: string
  paymentStatus: string
  paymentMethod: string
  paymentId?: string | null
  total: number | string
  discount?: number | string | null
  deliveryFee?: number | string | null
  deliveryMethod: string
  deliveryMessage?: string | null
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  zipCode?: string | null
  neighborhoodName?: string | null
  city?: string | null
  state?: string | null
  createdAt: string
  updatedAt: string
  items: Array<{
    id: number
    qty: number
    price: number | string
    product: { id: number; name: string; slug: string; images?: string | null }
    variant?: { id: number; name: string; images?: string | null } | null
  }>
  neighborhood?: { id: number; name: string; deliveryFee: number | string; city?: { name: string; state: string } } | null
  coupon?: { code: string; discountType: string; discountValue: number | string } | null
}

const STATUS_FLOW = ['pending', 'paid', 'confirmed', 'shipped', 'delivered'] as const

const STATUS_META: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Aguardando pagamento', icon: Clock, color: 'text-yellow-600' },
  paid: { label: 'Pagamento aprovado', icon: CheckCircle, color: 'text-blue-600' },
  confirmed: { label: 'Pedido confirmado', icon: CheckCircle, color: 'text-indigo-600' },
  shipped: { label: 'Em rota de entrega', icon: Truck, color: 'text-purple-600' },
  delivered: { label: 'Entregue', icon: Package, color: 'text-green-600' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600' },
}

function formatPrice(v: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getFirstImage(images: any): string | null {
  try {
    if (!images) return null
    if (Array.isArray(images)) return images[0] ?? null
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed[0] ?? null : null
  } catch { return null }
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix')
  const [isTestMode, setIsTestMode] = useState(false)
  const [cpf, setCpf] = useState('')
  const [paying, setPaying] = useState(false)
  const [showPixPayment, setShowPixPayment] = useState(false)

  // Receipt and Review States
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [reviewingItemId, setReviewingItemId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittedReviews, setSubmittedReviews] = useState<Set<number>>(new Set())

  async function handleConfirmDelivery() {
    if (!confirm('Deseja confirmar o recebimento deste pedido?')) return
    setUpdatingStatus(true)
    try {
      await api.post(`/account/orders/${id}/deliver`)
      toast.success('Recebimento confirmado! Obrigado por comprar conosco.')
      await loadOrder()
    } catch {
      toast.error('Erro ao confirmar recebimento')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleSubmitReview(productId: number) {
    if (!reviewText.trim()) {
      toast.error('Por favor, escreva um comentário para a avaliação.')
      return
    }
    setSubmittingReview(true)
    try {
      await api.post('/testimonials/review', {
        productId,
        rating: reviewRating,
        text: reviewText
      })
      toast.success('Avaliação enviada com sucesso! Ela passará por moderação.')
      setSubmittedReviews(prev => new Set(prev).add(productId))
      setReviewingItemId(null)
      setReviewText('')
      setReviewRating(5)
    } catch {
      toast.error('Erro ao enviar avaliação')
    } finally {
      setSubmittingReview(false)
    }
  }

  useLoaderEffect(loading, 'Carregando pedido...')

  useEffect(() => {
    if (!id) return
    loadOrder()
  }, [id])

  async function loadOrder() {
    setLoading(true)
    try {
      const { data } = await api.get<OrderDetail>(`/account/orders/${id}`)
      setOrder(data)
    } catch {
      toast.error('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!order) return
    setCancelling(true)
    useLoaderStore.getState().show('Cancelando pedido...')
    try {
      await api.post(`/account/orders/${order.id}/cancel`, { reason: cancelReason })
      toast.success('Pedido cancelado')
      setShowCancelModal(false)
      await loadOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar')
    } finally {
      setCancelling(false)
      useLoaderStore.getState().hide()
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-7 py-12 text-center text-ink-400">Carregando pedido...</div>
      </Layout>
    )
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-7 py-12 text-center">
          <p className="text-ink-500 mb-4">Pedido não encontrado</p>
          <Button onClick={() => navigate('/conta')}>Voltar à conta</Button>
        </div>
      </Layout>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const currentStepIdx = isCancelled ? -1 : STATUS_FLOW.indexOf(order.status as any)
  const canCancel = ['pending', 'paid'].includes(order.status)

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)
  const deliveryFee = order.deliveryMethod === 'retirada'
    ? 0
    : Number(order.deliveryFee || order.neighborhood?.deliveryFee || 0)

  const isWaitingQuote = order.paymentStatus === 'waiting_quote'

  // Build address string
  const fullAddress = [
    order.street && `${order.street}${order.number ? `, ${order.number}` : ''}`,
    order.complement,
    order.neighborhoodName || order.neighborhood?.name,
    order.city && order.state ? `${order.city} - ${order.state}` : null,
    order.zipCode && `CEP: ${order.zipCode}`,
  ].filter(Boolean).join(' — ')

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-7 py-8">
        <button
          onClick={() => navigate('/conta')}
          className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar aos meus pedidos
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-ink-200">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500 mb-1">Pedido</p>
            <h1 className="font-display italic text-3xl text-ink-800">#{order.id}</h1>
            <p className="text-sm text-ink-500 mt-1">Realizado em {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-ink-500 mb-1">Total</p>
            <p className="font-display italic text-3xl text-ink-800">{formatPrice(order.total)}</p>
          </div>
        </div>

        {/* Timeline interativa */}
        {!isCancelled ? (
          <div className="bg-white border border-ink-200 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-6">Status do pedido</h2>
            <div className="relative">
              {/* Linha de fundo */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-ink-100" />
              {/* Linha preenchida */}
              <div
                className="absolute top-5 left-5 h-0.5 bg-lilac-500 transition-all duration-700"
                style={{ width: currentStepIdx >= 0 ? `calc((100% - 40px) * ${currentStepIdx / (STATUS_FLOW.length - 1)})` : '0' }}
              />
              <div className="relative grid grid-cols-5 gap-2">
                {STATUS_FLOW.map((s, i) => {
                  const meta = STATUS_META[s]
                  const Icon = meta.icon
                  const isComplete = i <= currentStepIdx
                  const isCurrent = i === currentStepIdx
                  return (
                    <div key={s} className="flex flex-col items-center text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isComplete
                            ? 'bg-lilac-500 text-white shadow-md'
                            : 'bg-ink-100 text-ink-400'
                        } ${isCurrent ? 'ring-4 ring-lilac-200 scale-110' : ''}`}
                      >
                        <Icon size={16} />
                      </div>
                      <p className={`text-[10px] sm:text-xs mt-2 font-medium leading-tight ${isComplete ? 'text-ink-800' : 'text-ink-400'}`}>
                        {meta.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
            {isWaitingQuote && (
              <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                <Clock size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Aguardando cotação de frete</p>
                  <p className="text-xs mt-1">Nossa vendedora está calculando o valor do frete. Assim que ele for definido, você poderá finalizar o pagamento aqui mesmo.</p>
                </div>
              </div>
            )}
            {order.status === 'pending' && !isWaitingQuote && order.paymentMethod === 'pix' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                <Clock size={16} className="shrink-0 mt-0.5" />
                <span>Aguardando confirmação do pagamento via PIX. Assim que recebermos, o pedido avançará para o próximo passo.</span>
              </div>
            )}
            {order.status === 'shipped' && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-start gap-2">
                <Truck size={16} className="shrink-0 mt-0.5" />
                <span>Seu pedido está a caminho! Em breve nosso entregador entrará em contato.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex items-center gap-3">
            <XCircle size={28} className="text-red-500 shrink-0" />
            <div>
              <h2 className="font-semibold text-red-800">Pedido cancelado</h2>
              <p className="text-sm text-red-600">Este pedido foi cancelado e não será processado.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Coluna principal */}
          <div className="space-y-6">
            {/* Pagamento do Pedido (Apenas se status e paymentStatus forem pending) */}
            {order.status === 'pending' && order.paymentStatus === 'pending' && (
              <div className="bg-white border-2 border-lilac-200 rounded-xl p-6 shadow-md transition-all">
                <h2 className="font-display italic text-2xl text-ink-800 mb-4 flex items-center gap-2">
                  <CreditCard className="text-lilac-500" />
                  Efetuar Pagamento
                </h2>
                <p className="text-sm text-ink-600 mb-6 leading-relaxed">
                  O valor da entrega já foi definido! Selecione abaixo a sua forma de pagamento para concluir o pedido.
                </p>

                {showPixPayment ? (
                  <div>
                    <PixPayment
                      orderId={order.id}
                      customerEmail={order.customerEmail}
                      cpf={cpf}
                      isTestMode={isTestMode}
                      onSuccess={async () => {
                        toast.success('Pagamento PIX confirmado com sucesso!')
                        setShowPixPayment(false)
                        await loadOrder()
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-xs text-ink-500 hover:text-ink-800"
                      onClick={() => setShowPixPayment(false)}
                    >
                      ← Alterar forma de pagamento
                    </Button>
                  </div>
                ) : (
                  <div>
                    {/* Modo de Teste Checkbox */}
                    <div className="mb-6 flex items-center gap-2 bg-lilac-50/50 p-3 rounded-lg border border-lilac-100/50">
                      <input 
                        type="checkbox" 
                        id="orderTestMode" 
                        className="w-4 h-4 accent-ink-800 cursor-pointer"
                        checked={isTestMode}
                        onChange={e => setIsTestMode(e.target.checked)}
                      />
                      <label htmlFor="orderTestMode" className="text-xs font-semibold text-ink-700 cursor-pointer">
                        Ativar Modo de Teste (Simular Pagamento Sem Gateway Real)
                      </label>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="flex gap-4 mb-6">
                      <button
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'pix' 
                            ? 'border-lilac-500 bg-lilac-50 text-lilac-700' 
                            : 'border-ink-200 hover:border-ink-300 text-ink-600'
                        }`}
                        onClick={() => setPaymentMethod('pix')}
                      >
                        <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold">❖</div>
                        <span className="font-semibold text-sm">Pagar com PIX</span>
                      </button>
                      <button
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'card' 
                            ? 'border-lilac-500 bg-lilac-50 text-lilac-700' 
                            : 'border-ink-200 hover:border-ink-300 text-ink-600'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard size={24} />
                        <span className="font-semibold text-sm">Cartão de Crédito</span>
                      </button>
                    </div>

                    {/* PIX Form (Requires CPF) */}
                    {paymentMethod === 'pix' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CPF do Pagador</label>
                          <Input
                            value={cpf}
                            onChange={e => {
                              let value = e.target.value.replace(/\D/g, '')
                              if (value.length > 3) value = value.substring(0, 3) + '.' + value.substring(3)
                              if (value.length > 7) value = value.substring(0, 7) + '.' + value.substring(7)
                              if (value.length > 11) value = value.substring(0, 11) + '-' + value.substring(11, 13)
                              setCpf(value)
                            }}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            className="bg-white"
                          />
                        </div>
                        <Button 
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-pill animate-fade-in"
                          disabled={cpf.replace(/\D/g, '').length !== 11}
                          onClick={() => setShowPixPayment(true)}
                        >
                          Gerar QR Code PIX
                        </Button>
                      </div>
                    )}

                    {/* Credit Card Form */}
                    {paymentMethod === 'card' && (
                      <div className="bg-ink-50/50 p-4 rounded-xl border border-ink-100">
                        <CreditCardForm
                          isLoading={paying}
                          onTokenCreated={async (token, methodId, cardCpf) => {
                            setPaying(true)
                            useLoaderStore.getState().show('Processando pagamento...')
                            try {
                              const res = await api.post('/payment/process', {
                                orderId: order.id,
                                cardToken: token,
                                paymentMethodId: methodId,
                                installments: 1,
                                customerEmail: order.customerEmail,
                                customerPhone: order.customerPhone || undefined,
                                cpf: cardCpf,
                                isTestMode,
                              })
                              if (res.data.success || res.data.status === 'approved') {
                                toast.success('Pagamento de cartão confirmado!')
                                await loadOrder()
                              } else {
                                toast.error('O pagamento foi recusado. Verifique os dados e tente novamente.')
                              }
                            } catch (err: any) {
                              toast.error(err.response?.data?.error || 'Erro ao processar pagamento.')
                            } finally {
                              setPaying(false)
                              useLoaderStore.getState().hide()
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Itens */}
            <div className="bg-white border border-ink-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4 flex items-center gap-1">
                <Package size={14} /> Itens do pedido
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const img = getFirstImage(item.variant?.images) ?? getFirstImage(item.product.images)
                  const isDelivered = order.status === 'delivered'
                  const isReviewed = submittedReviews.has(item.product.id)
                  const isCurrentlyReviewing = reviewingItemId === item.id

                  return (
                    <div key={item.id} className="border-b border-ink-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex gap-3 py-2">
                        <Link
                          to={`/produto/${item.product.slug}`}
                          className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100 hover:opacity-90 transition-opacity"
                        >
                          {img ? (
                            <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/produto/${item.product.slug}`} className="text-sm font-semibold text-ink-800 hover:text-lilac-600 transition-colors line-clamp-2">
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-xs text-lilac-600 font-medium mt-0.5">{item.variant.name}</p>
                          )}
                          <p className="text-xs text-ink-500 mt-1">{formatPrice(item.price)} × {item.qty}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-ink-800">
                            {formatPrice(Number(item.price) * item.qty)}
                          </p>
                          {isDelivered && !isReviewed && !isCurrentlyReviewing && (
                            <button
                              onClick={() => {
                                setReviewingItemId(item.id)
                                setReviewRating(5)
                                setReviewText('')
                              }}
                              className="mt-2 text-xs font-semibold text-lilac-600 hover:text-lilac-700 hover:underline flex items-center gap-1 ml-auto"
                            >
                              ⭐ Avaliar produto
                            </button>
                          )}
                          {isReviewed && (
                            <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1 justify-end">
                              ✓ Avaliado
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Inline Review Form */}
                      {isCurrentlyReviewing && (
                        <div className="mt-3 p-4 bg-ink-50 rounded-lg border border-ink-200">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-700">Como foi sua experiência?</h4>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="text-lg transition-transform hover:scale-110"
                                >
                                  {star <= reviewRating ? '★' : '☆'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                            placeholder="Escreva sua opinião sincera sobre este produto..."
                            rows={3}
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-xs resize-none bg-white mb-3 focus:outline-none focus:ring-1 focus:ring-lilac-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => setReviewingItemId(null)}
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              disabled={submittingReview}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => handleSubmitReview(item.product.id)}
                              size="sm"
                              className="text-xs h-8 bg-lilac-500 hover:bg-lilac-600 text-white"
                              disabled={submittingReview}
                            >
                              {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Entrega */}
            <div className="bg-white border border-ink-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-1">
                <MapPin size={14} /> Entrega
              </h2>
              {order.deliveryMethod === 'retirada' ? (
                <p className="text-sm text-ink-700">Retirada na loja</p>
              ) : order.deliveryMethod === 'whatsapp_quote' ? (
                <div className="text-sm text-ink-700 space-y-1">
                  <p className="font-medium text-amber-700">💬 Orçamento via WhatsApp</p>
                  {fullAddress && <p className="text-ink-600">{fullAddress}</p>}
                  {isWaitingQuote ? (
                    <p className="text-xs text-amber-600 font-medium">Frete: A combinar</p>
                  ) : deliveryFee > 0 ? (
                    <p className="text-ink-500">Frete: {formatPrice(deliveryFee)}</p>
                  ) : null}
                </div>
              ) : order.neighborhood ? (
                <div className="text-sm text-ink-700">
                  <p className="font-medium">{order.neighborhood.name}</p>
                  {order.neighborhood.city && (
                    <p className="text-ink-500">{order.neighborhood.city.name} / {order.neighborhood.city.state}</p>
                  )}
                  {fullAddress && <p className="text-ink-500 text-xs">{fullAddress}</p>}
                  <p className="text-ink-500 mt-1">Taxa: {formatPrice(order.neighborhood.deliveryFee)}</p>
                </div>
              ) : (
                <div className="text-sm text-ink-500">
                  <p>Entrega local</p>
                  {fullAddress && <p className="text-xs">{fullAddress}</p>}
                </div>
              )}
              <p className="text-xs text-ink-400 mt-2">Cliente: {order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ''}</p>
            </div>

            {/* Pagamento */}
            <div className="bg-white border border-ink-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-1">
                <CreditCard size={14} /> Pagamento
              </h2>
              <p className="text-sm text-ink-700 capitalize">{order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de crédito'}</p>
              <p className="text-xs text-ink-500 mt-1">
                Status: <span className={`font-medium ${
                  order.paymentStatus === 'paid' || order.paymentStatus === 'approved' ? 'text-green-600'
                  : order.paymentStatus === 'waiting_quote' ? 'text-amber-600'
                  : 'text-yellow-600'
                }`}>
                  {order.paymentStatus === 'approved' || order.paymentStatus === 'paid' ? 'Aprovado'
                   : order.paymentStatus === 'waiting_quote' ? 'Aguardando Cotação'
                   : order.paymentStatus === 'pending' ? 'Pendente'
                   : order.paymentStatus}
                </span>
              </p>
            </div>

            {/* Mensagem */}
            {order.deliveryMessage && (
              <div className="bg-petal-50 border border-petal-200 rounded-xl p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-1">
                  <MessageSquare size={14} /> Mensagem para o presente
                </h2>
                <p className="text-sm text-ink-700 italic whitespace-pre-wrap">"{order.deliveryMessage}"</p>
              </div>
            )}
          </div>

          {/* Sidebar — resumo financeiro + ações */}
          <div className="space-y-4">
            <div className="bg-white border border-ink-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4">Resumo</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {Number(order.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto{order.coupon ? ` (${order.coupon.code})` : ''}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-600">
                  <span>Frete</span>
                  <span>{isWaitingQuote ? <span className="text-amber-600 font-medium">A combinar</span> : deliveryFee > 0 ? formatPrice(deliveryFee) : 'Grátis'}</span>
                </div>
                <div className="border-t border-ink-200 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-semibold text-ink-800">Total</span>
                  <span className="font-display italic text-xl text-ink-900">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Ações */}
              {canCancel && (
                <div className="mt-6 pt-6 border-t border-ink-200">
                  <Button
                    onClick={() => setShowCancelModal(true)}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50 gap-2"
                  >
                    <XCircle size={14} />
                    Solicitar cancelamento
                  </Button>
                  <p className="text-[10px] text-ink-400 mt-2 text-center">
                    Você ainda pode cancelar enquanto o pedido não for confirmado.
                  </p>
                </div>
              )}

              {['confirmed', 'shipped'].includes(order.status) && (
                <div className="mt-4 pt-4 border-t border-ink-200">
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={updatingStatus}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                  >
                    <CheckCircle size={14} />
                    Confirmar recebimento
                  </Button>
                  <p className="text-[10px] text-ink-400 mt-2 text-center">
                    Confirme se você já recebeu suas flores e mimos em mãos.
                  </p>
                </div>
              )}

              {!canCancel && !isCancelled && (
                <div className="mt-6 pt-6 border-t border-ink-200">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>Pedido já em processamento — entre em contato pelo WhatsApp para qualquer alteração.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-ink-800 text-lg mb-2">Cancelar pedido #{order.id}</h3>
            <p className="text-sm text-ink-500 mb-4">Tem certeza? Esta ação não pode ser desfeita.</p>
            <label className="block text-xs font-semibold text-ink-600 uppercase mb-2">Motivo (opcional)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Conte-nos o que aconteceu..."
              className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm resize-none"
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
                className="flex-1"
                disabled={cancelling}
              >
                Voltar
              </Button>
              <Button
                onClick={handleCancel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
