import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, Truck, Package, XCircle, MapPin, CreditCard, MessageSquare, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
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
    : Number(order.neighborhood?.deliveryFee || 0)

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
            {order.status === 'pending' && order.paymentMethod === 'pix' && (
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
            {/* Itens */}
            <div className="bg-white border border-ink-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4 flex items-center gap-1">
                <Package size={14} /> Itens do pedido
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const img = getFirstImage(item.variant?.images) ?? getFirstImage(item.product.images)
                  return (
                    <Link
                      to={`/produto/${item.product.slug}`}
                      key={item.id}
                      className="flex gap-3 py-2 hover:bg-ink-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100">
                        {img ? (
                          <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-lilac-600 font-medium mt-0.5">{item.variant.name}</p>
                        )}
                        <p className="text-xs text-ink-500 mt-1">{formatPrice(item.price)} × {item.qty}</p>
                      </div>
                      <p className="text-sm font-semibold text-ink-800 shrink-0">
                        {formatPrice(Number(item.price) * item.qty)}
                      </p>
                    </Link>
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
              ) : order.neighborhood ? (
                <div className="text-sm text-ink-700">
                  <p className="font-medium">{order.neighborhood.name}</p>
                  {order.neighborhood.city && (
                    <p className="text-ink-500">{order.neighborhood.city.name} / {order.neighborhood.city.state}</p>
                  )}
                  <p className="text-ink-500 mt-1">Taxa: {formatPrice(order.neighborhood.deliveryFee)}</p>
                </div>
              ) : (
                <p className="text-sm text-ink-500">Entrega local</p>
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
                Status: <span className={`font-medium ${order.paymentStatus === 'paid' || order.paymentStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.paymentStatus === 'approved' || order.paymentStatus === 'paid' ? 'Aprovado' : order.paymentStatus === 'pending' ? 'Pendente' : order.paymentStatus}
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
                  <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : 'Grátis'}</span>
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
