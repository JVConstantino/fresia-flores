import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Package, User, Lock, MapPin, CreditCard } from 'lucide-react'
import { neighborhoodService, type Neighborhood } from '@/services/neighborhoodService'

function formatNbhPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

import { SidebarUserCard } from '@/components/account/SidebarUserCard'
import { AddressCardGrid } from '@/components/account/AddressCardGrid'
import { CardWallet } from '@/components/account/CardWallet'
import { OrderExpandable, type OrderExpandableProps } from '@/components/account/OrderExpandable'
import { CreditCardFormFlip } from '@/components/features/CreditCardFormFlip'

type Tab = 'orders' | 'profile' | 'password' | 'addresses' | 'cards'

interface Address {
  id: number
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

interface PaymentCard {
  id: number
  brand: string
  lastFour: string
  nickname?: string | null
  isDefault: boolean
  createdAt: string
}

interface Order extends OrderExpandableProps {
  id: number
}

export function ContaPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
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

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    isDefault: false
  })
  const [loadingCep, setLoadingCep] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<Neighborhood[]>([])

  // Cards state
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [showCardForm, setShowCardForm] = useState(false)
  const [savingCard, setSavingCard] = useState(false)

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'orders') loadOrders()
    if (activeTab === 'addresses') loadAddresses()
    if (activeTab === 'cards') loadCards()
  }, [activeTab])

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const { data } = await api.get('/account/orders')
      setOrders(data)
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoadingOrders(false)
    }
  }

  async function loadAddresses() {
    try {
      const { data } = await api.get('/account/addresses')
      setAddresses(data)
    } catch {
      toast.error('Erro ao carregar endereços')
    }
  }

  async function loadCards() {
    try {
      const { data } = await api.get('/account/cards')
      setCards(data)
    } catch {
      toast.error('Erro ao carregar cartões')
    }
  }

  // Profile handlers
  async function handleSaveProfile() {
    if (!profileName) {
      toast.error('Nome é obrigatório')
      return
    }
    setSavingProfile(true)
    try {
      await api.patch('/account/profile', { name: profileName, phone: profilePhone })
      toast.success('Perfil atualizado')
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  // Password handlers
  async function handleSavePassword() {
    if (!currentPassword || !newPassword) {
      toast.error('Preencha todos os campos')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    setSavingPassword(true)
    try {
      await api.patch('/account/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Senha atualizada com sucesso')
    } catch {
      toast.error('Erro ao atualizar senha')
    } finally {
      setSavingPassword(false)
    }
  }

  // Address handlers
  async function handleCepBlur() {
    const cep = addressForm.zipCode.replace(/\D/g, '')
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        toast.error('CEP não encontrado')
      } else {
        setAddressForm(f => ({
          ...f,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
        await loadAccountNeighborhoods(data.localidade, data.uf, data.bairro)
      }
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  async function loadAccountNeighborhoods(cityName: string, state: string, currentBairro?: string) {
    try {
      const cities = await neighborhoodService.getCities()
      const match = cities.find(c =>
        c.name.toLowerCase() === cityName.toLowerCase() &&
        c.state.toLowerCase() === state.toLowerCase()
      )
      if (match) {
        const nbhs = await neighborhoodService.getNeighborhoods(match.id)
        setAvailableNeighborhoods(nbhs)
        if (currentBairro && nbhs.length > 0) {
          const matched = nbhs.find(n =>
            n.name.toLowerCase() === currentBairro.toLowerCase() ||
            currentBairro.toLowerCase().includes(n.name.toLowerCase())
          )
          if (matched) {
            setAddressForm(f => ({ ...f, neighborhood: matched.name }))
          } else {
            setAddressForm(f => ({ ...f, neighborhood: '' }))
          }
        }
      } else {
        setAvailableNeighborhoods([])
      }
    } catch {
      setAvailableNeighborhoods([])
    }
  }

  function openAddressForm(address?: Address) {
    if (address) {
      setEditingAddress(address)
      setAddressForm({
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        isDefault: address.isDefault
      })
    } else {
      setEditingAddress(null)
      setAddressForm({
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        isDefault: false
      })
    }
    setShowAddressForm(true)
  }

  async function handleSaveAddress() {
    const required = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
    if (required.some(f => !addressForm[f as keyof typeof addressForm])) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSavingAddress(true)
    try {
      if (editingAddress) {
        await api.put(`/account/addresses/${editingAddress.id}`, addressForm)
        toast.success('Endereço atualizado')
      } else {
        await api.post('/account/addresses', addressForm)
        toast.success('Endereço adicionado')
      }
      setShowAddressForm(false)
      loadAddresses()
    } catch {
      toast.error('Erro ao salvar endereço')
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleDeleteAddress(id: number) {
    if (!confirm('Tem certeza que quer deletar este endereço?')) return
    try {
      await api.delete(`/account/addresses/${id}`)
      toast.success('Endereço removido')
      loadAddresses()
    } catch {
      toast.error('Erro ao deletar endereço')
    }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('Tem certeza que quer deletar este cartão?')) return
    try {
      await api.delete(`/account/cards/${id}`)
      toast.success('Cartão removido')
      loadCards()
    } catch {
      toast.error('Erro ao deletar cartão')
    }
  }

  async function handleSaveCard(data: {
    cardNumber: string
    cardholderName: string
    cardExpirationMonth: string
    cardExpirationYear: string
    securityCode: string
  }) {
    setSavingCard(true)
    try {
      // TODO: In real implementation, call window.MercadoPago.createCardToken(data)
      // to get real token from MP. For now, simulate with mock token.
      const mockToken = `test_token_${data.cardNumber.slice(-4)}_${Date.now()}`
      const brand = 'visa' // TODO: Use detected brand or brand from MP response

      await api.post('/account/cards', {
        mpToken: mockToken,
        brand,
        lastFour: data.cardNumber.slice(-4),
        nickname: '',
        isDefault: cards.length === 0 // First card is default
      })

      toast.success('Cartão adicionado com sucesso')
      setShowCardForm(false)
      loadCards()
    } catch {
      toast.error('Erro ao salvar cartão')
    } finally {
      setSavingCard(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Calculate stats
  const stats = {
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    addressCount: addresses.length,
    cardCount: cards.length
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <SidebarUserCard stats={stats} onLogout={handleLogout} />

          {/* Main Content */}
          <div>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-ink-200">
              {[
                { id: 'orders', label: 'Pedidos', icon: Package },
                { id: 'profile', label: 'Perfil', icon: User },
                { id: 'password', label: 'Senha', icon: Lock },
                { id: 'addresses', label: 'Endereços', icon: MapPin },
                { id: 'cards', label: 'Cartões', icon: CreditCard }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-lilac-500 text-lilac-600 font-semibold'
                      : 'border-transparent text-ink-600 hover:text-ink-800'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">Meus Pedidos</h2>
                {loadingOrders ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-ink-400">
                    <Package className="mx-auto mb-2 opacity-50" size={40} />
                    <p>Você ainda não tem pedidos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <OrderExpandable key={order.id} {...order} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nome</label>
                  <Input
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Telefone</label>
                  <Input
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="w-full"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-semibold mb-2">Senha Atual</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Nova Senha</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Confirmar Nova Senha</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={handleSavePassword}
                  disabled={savingPassword}
                  className="w-full"
                >
                  {savingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                {!showAddressForm ? (
                  <AddressCardGrid
                    addresses={addresses}
                    isLoading={false}
                    onEdit={openAddressForm}
                    onDelete={handleDeleteAddress}
                    onAddNew={() => openAddressForm()}
                  />
                ) : (
                  <div className="max-w-md space-y-4 mb-6 p-4 bg-ink-50 rounded-lg">
                    <h3 className="font-semibold">
                      {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                    </h3>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CEP</label>
                      <Input
                        value={addressForm.zipCode}
                        onChange={e => setAddressForm(f => ({ ...f, zipCode: e.target.value }))}
                        onBlur={handleCepBlur}
                        placeholder="12345-678"
                      />
                      {loadingCep && <p className="text-xs text-ink-500 mt-1">Buscando...</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Rua</label>
                      <Input
                        value={addressForm.street}
                        onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                        placeholder="Rua..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Número</label>
                        <Input
                          value={addressForm.number}
                          onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))}
                          placeholder="123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Complemento</label>
                        <Input
                          value={addressForm.complement}
                          onChange={e => setAddressForm(f => ({ ...f, complement: e.target.value }))}
                          placeholder="Apto 45 (opcional)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bairro</label>
                      {availableNeighborhoods.length > 0 ? (
                        <>
                          <select
                            value={addressForm.neighborhood}
                            onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
                          >
                            <option value="">Selecione o bairro de entrega...</option>
                            {availableNeighborhoods.map(n => (
                              <option key={n.id} value={n.name}>
                                {n.name} — Frete {formatNbhPrice(Number(n.deliveryFee))}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-lilac-600 mt-1">✓ Cidade na área de entrega da Frésia</p>
                        </>
                      ) : (
                        <Input
                          value={addressForm.neighborhood}
                          onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                          placeholder="Bairro..."
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Cidade</label>
                        <Input
                          value={addressForm.city}
                          onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="São Paulo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Estado</label>
                        <Input
                          value={addressForm.state}
                          onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                          placeholder="SP"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))}
                      />
                      <span className="text-sm">Definir como endereço padrão</span>
                    </label>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveAddress}
                        disabled={savingAddress}
                        className="flex-1"
                      >
                        {savingAddress ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        onClick={() => setShowAddressForm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cards' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Meus Cartões</h3>
                  {!showCardForm && (
                    <button
                      onClick={() => setShowCardForm(true)}
                      className="px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg text-sm transition-colors"
                    >
                      ＋ Novo Cartão
                    </button>
                  )}
                </div>

                {showCardForm ? (
                  <div className="mb-6">
                    <CreditCardFormFlip
                      onSubmit={handleSaveCard}
                      isLoading={savingCard}
                    />
                    <button
                      onClick={() => setShowCardForm(false)}
                      className="mt-4 px-4 py-2 border border-ink-200 hover:bg-ink-50 text-ink-800 rounded-lg text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="text-center py-8 text-ink-400">
                    <CreditCard className="mx-auto mb-2 opacity-50" size={40} />
                    <p>Nenhum cartão cadastrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {cards.map(card => (
                      <CardWallet
                        key={card.id}
                        {...card}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
