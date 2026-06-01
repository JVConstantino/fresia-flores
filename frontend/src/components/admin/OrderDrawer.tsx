import { useState, useEffect } from 'react'
import { X, Package, User, MapPin, CreditCard, MessageSquare, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { adminOrderService } from '@/services/adminOrderService'

interface OrderDrawerProps {
  orderId: number | null
  onClose: () => void
  onStatusUpdated: () => void
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  paid: 'Pago',
  processing: 'Processando',
  waiting_quote: 'Aguardando Cotação',
}

function getFirstImage(images: any): string | null {
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

function formatPrice(v: number | string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR')
}

export function OrderDrawer({ orderId, onClose, onStatusUpdated }: OrderDrawerProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Delivery fee manual entry state
  const [manualFee, setManualFee] = useState('')
  const [savingFee, setSavingFee] = useState(false)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    adminOrderService.getById(orderId)
      .then(o => {
        setOrder(o)
        setNewStatus(o.status)
        setManualFee('')
      })
      .catch(() => toast.error('Erro ao carregar pedido'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (!orderId) return null

  async function handleUpdateStatus() {
    if (!order || newStatus === order.status) return
    setSaving(true)
    try {
      await adminOrderService.updateStatus(order.id, newStatus)
      setOrder({ ...order, status: newStatus })
      onStatusUpdated()
      toast.success('Status atualizado')
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDeliveryFee() {
    if (!order) return
    const fee = parseFloat(manualFee.replace(',', '.'))
    if (isNaN(fee) || fee < 0) {
      toast.error('Informe um valor de frete válido')
      return
    }
    setSavingFee(true)
    try {
      const updated = await adminOrderService.setDeliveryFee(order.id, fee)
      setOrder({ ...order, deliveryFee: updated.deliveryFee, total: updated.total, paymentStatus: updated.paymentStatus })
      onStatusUpdated()
      toast.success(`Frete de ${formatPrice(fee)} definido! O cliente já pode finalizar o pagamento.`)
      setManualFee('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao definir frete')
    } finally {
      setSavingFee(false)
    }
  }

  const subtotal = order?.items?.reduce(
    (sum: number, item: any) => sum + Number(item.price) * item.qty, 0
  ) ?? 0

  // Build full address string from order fields
  const fullAddress = order ? [
    order.street && `${order.street}${order.number ? `, ${order.number}` : ''}`,
    order.complement,
    order.neighborhoodName || order.neighborhood?.name,
    order.city && order.state ? `${order.city} - ${order.state}` : null,
    order.zipCode && `CEP: ${order.zipCode}`,
  ].filter(Boolean).join(' — ') : ''

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-lilac-500" />
            <h2 className="text-lg font-semibold text-ink-800">
              Pedido {order ? `#${order.id}` : '...'}
            </h2>
            {order && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[order.status] || 'bg-ink-100 text-ink-600'}`}>
                {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-ink-400">Carregando...</div>
        ) : order ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Waiting Quote Alert — show only for whatsapp_quote orders */}
            {order.paymentStatus === 'waiting_quote' && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <Truck size={18} />
                  <p className="font-semibold text-sm">⚠️ Aguardando Cotação de Frete</p>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Este pedido foi feito via WhatsApp Quote. Defina o valor do frete combinado para que o cliente possa finalizar o pagamento.
                </p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-amber-800 mb-1 block">Valor do frete (R$)</label>
                    <input
                      type="text"
                      value={manualFee}
                      onChange={e => setManualFee(e.target.value)}
                      placeholder="Ex: 25,00"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSetDeliveryFee}
                    disabled={savingFee || !manualFee}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {savingFee ? 'Salvando...' : 'Definir Frete'}
                  </button>
                </div>
              </div>
            )}

            {/* Alterar Status */}
            <div className="p-4 bg-ink-50 rounded-xl border border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">Alterar Status</p>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving || newStatus === order.status}
                  className="px-4 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2 flex items-center gap-1">
                <User size={12} /> Cliente
              </p>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-ink-800">{order.customerName}</p>
                <p className="text-ink-500">{order.customerEmail}</p>
                {order.customerPhone && <p className="text-ink-500">{order.customerPhone}</p>}
                {order.user && (
                  <p className="text-xs text-lilac-600">Conta registrada: {order.user.name}</p>
                )}
              </div>
            </div>

            {/* Entrega */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2 flex items-center gap-1">
                <MapPin size={12} /> Entrega
              </p>
              <div className="text-sm text-ink-700 space-y-1">
                {order.deliveryMethod === 'retirada' ? (
                  <p>Retirada na loja</p>
                ) : order.deliveryMethod === 'whatsapp_quote' ? (
                  <>
                    <p className="font-medium text-amber-700">💬 Orçamento via WhatsApp</p>
                    {fullAddress && <p className="text-ink-600">{fullAddress}</p>}
                  </>
                ) : order.neighborhood ? (
                  <>
                    <p>{order.neighborhood.name} — {formatPrice(order.neighborhood.deliveryFee)}</p>
                    {fullAddress && <p className="text-ink-500 text-xs">{fullAddress}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-ink-400">Sem bairro cadastrado</p>
                    {fullAddress && <p className="text-ink-500 text-xs">{fullAddress}</p>}
                  </>
                )}
              </div>
            </div>

            {/* Pagamento */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2 flex items-center gap-1">
                <CreditCard size={12} /> Pagamento
              </p>
              <div className="text-sm space-y-1">
                <p className="text-ink-700 capitalize">{order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de crédito'}</p>
                <p className="text-ink-500">
                  Status: <span className={`font-medium ${
                    order.paymentStatus === 'paid' || order.paymentStatus === 'approved' ? 'text-green-600'
                    : order.paymentStatus === 'waiting_quote' ? 'text-amber-600'
                    : 'text-yellow-600'
                  }`}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                  </span>
                </p>
                {order.paymentId && (
                  <p className="text-xs text-ink-400 font-mono">ID: {order.paymentId}</p>
                )}
              </div>
            </div>

            {/* Itens */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-1">
                <Package size={12} /> Itens do Pedido
              </p>
              <div className="space-y-3">
                {order.items?.map((item: any, i: number) => {
                  const productImg = getFirstImage(item.variant?.images) ?? getFirstImage(item.product?.images)
                  return (
                    <div key={i} className="flex gap-3 py-3 border-b border-ink-50 last:border-0">
                      {/* Imagem */}
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100">
                        {productImg ? (
                          <img src={productImg} alt={item.product?.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800">{item.product?.name || 'Produto removido'}</p>
                        {item.variant && (
                          <p className="text-xs text-lilac-600 font-medium mt-0.5">{item.variant.name}</p>
                        )}
                        {item.variant?.description && (
                          <p className="text-xs text-ink-400">{item.variant.description}</p>
                        )}
                        <p className="text-xs text-ink-500 mt-1">{formatPrice(item.price)} × {item.qty}</p>
                      </div>
                      {/* Total */}
                      <p className="text-sm font-semibold text-ink-800 flex-shrink-0">
                        {formatPrice(Number(item.price) * item.qty)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totais */}
            <div className="p-4 bg-ink-50 rounded-xl border border-ink-100 space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              {order.deliveryFee != null && Number(order.deliveryFee) > 0 && (
                <div className="flex justify-between text-ink-600">
                  <span>Frete</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              {order.paymentStatus === 'waiting_quote' && (
                <div className="flex justify-between text-amber-600">
                  <span>Frete</span>
                  <span className="font-medium">A definir</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-ink-800 pt-2 border-t border-ink-200 text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Mensagem */}
            {order.deliveryMessage && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2 flex items-center gap-1">
                  <MessageSquare size={12} /> Mensagem para presente
                </p>
                <p className="text-sm text-ink-700 italic bg-petal-50 border border-petal-100 rounded-lg p-3">
                  "{order.deliveryMessage}"
                </p>
              </div>
            )}

            {/* Data */}
            <p className="text-xs text-ink-400">Pedido criado em {formatDate(order.createdAt)}</p>

          </div>
        ) : null}
      </div>
    </>
  )
}
