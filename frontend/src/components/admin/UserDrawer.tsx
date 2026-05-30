import { useState, useEffect } from 'react'
import { X, MapPin, CreditCard, ShoppingBag, ChevronDown, AlertTriangle, RotateCcw, Key } from 'lucide-react'
import { toast } from 'sonner'
import { adminUserService, type AdminUserDetail } from '@/services/adminUserService'
import { CardWallet } from '@/components/account/CardWallet'

interface UserDrawerProps {
  userId: number | null
  onClose: () => void
  onUserUpdated: () => void
}

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function UserDrawer({ userId, onClose, onUserUpdated }: UserDrawerProps) {
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [settingTempPw, setSettingTempPw] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    adminUserService.getById(userId)
      .then(u => {
        setUser(u)
        setEditName(u.name)
        setEditPhone(u.phone || '')
      })
      .catch(() => toast.error('Erro ao carregar usuário'))
      .finally(() => setLoading(false))
  }, [userId])

  if (!userId) return null

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await adminUserService.update(user.id, { name: editName, phone: editPhone })
      setUser(u => u ? { ...u, name: editName, phone: editPhone } : u)
      onUserUpdated()
      toast.success('Dados atualizados')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend() {
    if (!user) return
    const next = !user.isSuspended
    try {
      await adminUserService.suspend(user.id, next)
      setUser(u => u ? { ...u, isSuspended: next } : u)
      onUserUpdated()
      toast.success(next ? 'Usuário suspenso' : 'Usuário reativado')
    } catch {
      toast.error('Erro ao suspender/reativar')
    }
  }

  async function handleResetPassword() {
    if (!user) return
    try {
      const res = await adminUserService.resetPassword(user.id)
      toast.success(res.message)
    } catch {
      toast.error('Erro ao enviar email de reset')
    }
  }

  async function handleSetTempPassword() {
    if (!user || !tempPassword) return
    setSettingTempPw(true)
    try {
      const res = await adminUserService.setTempPassword(user.id, tempPassword)
      toast.success(res.message)
      setShowTempPasswordModal(false)
      setTempPassword('')
    } catch {
      toast.error('Erro ao definir senha temporária')
    } finally {
      setSettingTempPw(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-800">Detalhes do Usuário</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-ink-400">Carregando...</div>
        ) : user ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Avatar + Info */}
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} className="w-16 h-16 rounded-full object-cover border-2 border-ink-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-lilac-100 text-lilac-600 flex items-center justify-center text-xl font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-ink-800">{user.name}</p>
                <p className="text-sm text-ink-500">{user.email}</p>
                <div className="flex gap-2 mt-1">
                  {user.isAdmin && <span className="text-[10px] bg-lilac-100 text-lilac-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>}
                  {user.isSuspended && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Suspenso</span>}
                  {user.mustChangePassword && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Deve alterar senha</span>}
                </div>
              </div>
            </div>

            {/* Editar dados */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Dados</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nome"
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Telefone"
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg text-sm font-semibold"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Ações</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSuspend}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    user.isSuspended
                      ? 'border-green-500 text-green-600 hover:bg-green-50'
                      : 'border-red-400 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <AlertTriangle size={14} />
                  {user.isSuspended ? 'Reativar Conta' : 'Suspender Conta'}
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-ink-300 text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  <RotateCcw size={14} />
                  Enviar Reset de Senha
                </button>
                <button
                  onClick={() => setShowTempPasswordModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-ink-300 text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  <Key size={14} />
                  Senha Temporária
                </button>
              </div>
            </div>

            {/* Endereços */}
            {user.addresses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1">
                  <MapPin size={12} /> Endereços ({user.addresses.length})
                </h3>
                <div className="space-y-2">
                  {user.addresses.map(addr => (
                    <div key={addr.id} className="p-3 bg-ink-50 rounded-lg text-sm">
                      {addr.isDefault && <span className="text-[10px] font-semibold text-lilac-600">● PADRÃO &nbsp;</span>}
                      <span className="text-ink-700">{addr.street}, {addr.number}</span>
                      {addr.complement && <span className="text-ink-500"> — {addr.complement}</span>}
                      <p className="text-ink-500">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cartões */}
            {user.paymentCards.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1">
                  <CreditCard size={12} /> Cartões ({user.paymentCards.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {user.paymentCards.map(card => (
                    <CardWallet key={card.id} {...card} />
                  ))}
                </div>
              </div>
            )}

            {/* Pedidos */}
            {user.orders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1">
                  <ShoppingBag size={12} /> Pedidos ({user.orders.length})
                </h3>
                <div className="space-y-2">
                  {user.orders.map(order => (
                    <div key={order.id} className="border border-ink-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-ink-50 hover:bg-ink-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-semibold text-ink-800">#{order.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-ink-100 text-ink-600'}`}>
                            {order.status}
                          </span>
                          <span className="text-ink-500">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink-800">{formatPrice(Number(order.total))}</span>
                          <ChevronDown size={14} className={`text-ink-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {expandedOrder === order.id && (
                        <div className="px-4 py-3 space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm text-ink-600">
                              <span>{item.product.name} x{item.qty}</span>
                              <span>{formatPrice(Number(item.price) * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Modal senha temporária */}
      {showTempPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-ink-800 mb-4">Definir Senha Temporária</h3>
            <input
              type="text"
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSetTempPassword}
                disabled={settingTempPw || tempPassword.length < 6}
                className="flex-1 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg text-sm font-semibold"
              >
                {settingTempPw ? 'Salvando...' : 'Definir'}
              </button>
              <button
                onClick={() => { setShowTempPasswordModal(false); setTempPassword('') }}
                className="flex-1 py-2 border border-ink-200 text-ink-600 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
