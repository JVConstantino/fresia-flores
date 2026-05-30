'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Package, User, Lock, MapPin, CreditCard, LogOut } from 'lucide-react'

type Tab = 'orders' | 'profile' | 'password' | 'addresses' | 'cards'

interface Order {
  id: number
  status: string
  total: number
  createdAt: string
  items: Array<{
    productName: string
    variantName?: string
    qty: number
    price: number
  }>
}

export default function ContaPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('orders')

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Profile state
  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (activeTab === 'orders') loadOrders()
  }, [activeTab, user])

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const res = await api.get('/account/orders')
      setOrders(res.data)
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoadingOrders(false)
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      await api.patch('/account/profile', { name: profileName, phone: profilePhone })
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    setSavingPassword(true)
    try {
      await api.patch('/account/password', { currentPassword, newPassword })
      toast.success('Senha alterada!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Erro ao alterar senha')
    } finally {
      setSavingPassword(false)
    }
  }

  function handleLogout() {
    logout()
    router.push('/')
  }

  if (!user) {
    return null
  }

  const tabs = [
    { id: 'orders' as Tab, label: 'Pedidos', icon: Package },
    { id: 'profile' as Tab, label: 'Perfil', icon: User },
    { id: 'password' as Tab, label: 'Senha', icon: Lock },
    { id: 'addresses' as Tab, label: 'Endereços', icon: MapPin },
    { id: 'cards' as Tab, label: 'Cartões', icon: CreditCard },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-7 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white border border-ink-200 rounded-xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lilac-200 to-petal-200 flex items-center justify-center text-2xl mx-auto mb-3">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-display text-lg text-ink-800">{user.name}</h2>
              <p className="text-sm text-ink-500">{user.email}</p>
            </div>

            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-lilac-100 text-lilac-700'
                      : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Sair
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Orders */}
          {activeTab === 'orders' && (
            <div>
              <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Meus Pedidos</h1>
              {loadingOrders ? (
                <div className="text-center py-12 text-ink-500">Carregando...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="text-ink-300 mx-auto mb-4" />
                  <p className="text-ink-500 mb-4">Você ainda não fez nenhum pedido</p>
                  <Link href="/loja">
                    <Button className="bg-lilac-500 hover:bg-lilac-600 text-white">
                      Explorar Loja
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white border border-ink-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-ink-500">Pedido #{order.id}</p>
                          <p className="text-xs text-ink-400">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'confirmed' ? 'bg-lilac-100 text-lilac-700' :
                          'bg-ink-100 text-ink-700'
                        }`}>
                          {order.status === 'delivered' ? 'Entregue' :
                           order.status === 'shipped' ? 'Enviado' :
                           order.status === 'confirmed' ? 'Confirmado' :
                           'Pendente'}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-ink-700">
                              {item.qty}x {item.productName}
                              {item.variantName && ` - ${item.variantName}`}
                            </span>
                            <span className="text-ink-500">
                              R$ {(Number(item.price) * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-ink-200 pt-3 flex justify-between">
                        <span className="font-medium text-ink-800">Total</span>
                        <span className="font-display text-lg font-semibold text-ink-900">
                          R$ {Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div>
              <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Meu Perfil</h1>
              <div className="bg-white border border-ink-200 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Nome</label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
                  <Input value={user.email} disabled className="bg-ink-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Telefone</label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-lilac-500 hover:bg-lilac-600 text-white"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          )}

          {/* Password */}
          {activeTab === 'password' && (
            <div>
              <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Alterar Senha</h1>
              <div className="bg-white border border-ink-200 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Senha atual</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Nova senha</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Confirmar nova senha</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="bg-lilac-500 hover:bg-lilac-600 text-white"
                >
                  {savingPassword ? 'Alterando...' : 'Alterar senha'}
                </Button>
              </div>
            </div>
          )}

          {/* Addresses placeholder */}
          {activeTab === 'addresses' && (
            <div>
              <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Meus Endereços</h1>
              <div className="bg-white border border-ink-200 rounded-xl p-6 text-center">
                <MapPin size={48} className="text-ink-300 mx-auto mb-4" />
                <p className="text-ink-500 mb-4">Gerenciamento de endereços em breve</p>
              </div>
            </div>
          )}

          {/* Cards placeholder */}
          {activeTab === 'cards' && (
            <div>
              <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Meus Cartões</h1>
              <div className="bg-white border border-ink-200 rounded-xl p-6 text-center">
                <CreditCard size={48} className="text-ink-300 mx-auto mb-4" />
                <p className="text-ink-500 mb-4">Gerenciamento de cartões em breve</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
