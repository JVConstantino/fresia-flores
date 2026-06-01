import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Package, User, Lock, MapPin, CreditCard, ArrowLeft, LogOut, Upload } from 'lucide-react'
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
  const { user, logout, setUserAvatar } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await api.post('/account/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUserAvatar(data.avatarUrl)
      toast.success('Avatar atualizado com sucesso')
    } catch (err) {
      toast.error('Erro ao fazer upload do avatar')
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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
    <Layout hideHeader={true} hideFooter={true}>
      {/* Mobile App-style Minimal Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-ink-200 px-4 py-3.5 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="text-ink-600 hover:text-ink-800 flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          Início
        </button>
        <span className="font-bold text-ink-800 text-sm">Minha Conta</span>
        <button 
          onClick={handleLogout} 
          className="text-ink-500 hover:text-red-500 transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full px-0 md:px-4 py-0 md:py-6 pb-20 md:pb-0 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 flex-1">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <SidebarUserCard stats={stats} onLogout={handleLogout} />
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1 bg-white md:bg-transparent px-4 md:px-0">
            {/* Tab Navigation - Desktop Only */}
            <div className="hidden md:flex gap-2 mb-6 border-b border-ink-200 overflow-x-auto whitespace-nowrap scrollbar-none">
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
              <div className="space-y-4 py-4 md:py-0">
                <h2 className="text-xl md:text-2xl font-bold text-ink-800 mb-4 md:mb-6">Meus Pedidos</h2>
                {loadingOrders ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-ink-400 bg-ink-50 rounded-xl p-6 border border-dashed border-ink-200">
                    <Package className="mx-auto mb-2 opacity-50" size={40} />
                    <p className="text-sm">Você ainda não tem pedidos finalizados.</p>
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
              <div className="space-y-6 max-w-md py-4 md:py-0">
                {/* Mobile Avatar & Stats Card */}
                <div className="lg:hidden bg-gradient-to-b from-lilac-50 to-transparent rounded-2xl p-5 border border-lilac-100/50 flex flex-col items-center text-center mb-6 shadow-sm">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full bg-lilac-500 flex items-center justify-center text-white overflow-hidden shadow-md">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-3xl font-bold">{getInitials(user?.name || '')}</div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-petal-400 rounded-full p-2 cursor-pointer hover:bg-petal-300 transition-colors shadow">
                      <Upload size={12} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {uploading && (
                      <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-ink-800 text-lg">{user?.name}</h3>
                  <p className="text-xs text-ink-500 mb-4">{user?.email}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-3 text-center border-t border-ink-100 pt-4 mt-1">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-400">Pedidos</p>
                      <p className="text-sm font-bold text-lilac-600">{stats.orderCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-ink-400">Total Gasto</p>
                      <p className="text-sm font-bold text-lilac-600">R$ {stats.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-ink-800 mb-4 md:mb-6 hidden md:block">Perfil</h2>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Nome</label>
                    <Input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Telefone</label>
                    <Input
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full mt-2"
                  >
                    {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-4 max-w-md py-4 md:py-0">
                <h2 className="text-xl md:text-2xl font-bold text-ink-800 mb-4 md:mb-6">Alterar Senha</h2>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Senha Atual</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Nova Senha</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Confirmar Nova Senha</label>
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
                  className="w-full mt-2"
                >
                  {savingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="py-4 md:py-0">
                <h2 className="text-xl md:text-2xl font-bold text-ink-800 mb-4 md:mb-6">Meus Endereços</h2>
                {!showAddressForm ? (
                  <AddressCardGrid
                    addresses={addresses}
                    isLoading={false}
                    onEdit={openAddressForm}
                    onDelete={handleDeleteAddress}
                    onAddNew={() => openAddressForm()}
                  />
                ) : (
                  <div className="max-w-md space-y-4 mb-6 p-4 bg-ink-50 rounded-lg border border-ink-200">
                    <h3 className="font-semibold text-ink-800 text-sm">
                      {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                    </h3>
                    <div>
                      <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">CEP</label>
                      <Input
                        value={addressForm.zipCode}
                        onChange={e => setAddressForm(f => ({ ...f, zipCode: e.target.value }))}
                        onBlur={handleCepBlur}
                        placeholder="12345-678"
                      />
                      {loadingCep && <p className="text-xs text-ink-500 mt-1">Buscando...</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">Rua</label>
                      <Input
                        value={addressForm.street}
                        onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                        placeholder="Rua..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">Número</label>
                        <Input
                          value={addressForm.number}
                          onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))}
                          placeholder="123"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">Complemento</label>
                        <Input
                          value={addressForm.complement}
                          onChange={e => setAddressForm(f => ({ ...f, complement: e.target.value }))}
                          placeholder="Apto 45 (opcional)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">Bairro</label>
                      {availableNeighborhoods.length > 0 ? (
                        <>
                          <select
                            value={addressForm.neighborhood}
                            onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white focus:outline-none"
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
                        <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">Cidade</label>
                        <Input
                          value={addressForm.city}
                          onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="São Paulo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase mb-2">Estado</label>
                        <Input
                          value={addressForm.state}
                          onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                          placeholder="SP"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))}
                        className="rounded text-lilac-500 w-4 h-4"
                      />
                      <span className="text-sm text-ink-700">Definir como endereço padrão</span>
                    </label>
                    <div className="flex gap-3 pt-2">
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
              <div className="py-4 md:py-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-ink-800">Meus Cartões</h2>
                  {!showCardForm && (
                    <button
                      onClick={() => setShowCardForm(true)}
                      className="px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg text-sm transition-colors font-semibold"
                    >
                      ＋ Novo Cartão
                    </button>
                  )}
                </div>

                {showCardForm ? (
                  <div className="mb-6 max-w-lg">
                    <CreditCardFormFlip
                      onSubmit={handleSaveCard}
                      isLoading={savingCard}
                    />
                    <button
                      onClick={() => setShowCardForm(false)}
                      className="mt-4 w-full py-2.5 border border-ink-200 hover:bg-ink-50 text-ink-800 rounded-lg text-sm transition-colors font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="text-center py-8 text-ink-400 bg-ink-50 rounded-xl p-6 border border-dashed border-ink-200">
                    <CreditCard className="mx-auto mb-2 opacity-50" size={40} />
                    <p className="text-sm">Nenhum cartão de crédito cadastrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Mobile App-style Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-ink-900/90 border border-white/10 backdrop-blur-lg flex justify-around items-center py-2.5 rounded-2xl shadow-xl shadow-ink-950/20">
        {[
          { id: 'orders', label: 'Pedidos', icon: Package },
          { id: 'addresses', label: 'Endereços', icon: MapPin },
          { id: 'cards', label: 'Cartões', icon: CreditCard },
          { id: 'profile', label: 'Perfil', icon: User },
          { id: 'password', label: 'Senha', icon: Lock }
        ].map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-[8px] uppercase tracking-widest font-bold transition-all relative py-1"
            >
              <tab.icon size={17} className={active ? 'text-lilac-400 scale-110 transition-transform' : 'text-ink-400'} />
              <span className={active ? 'text-white font-extrabold' : 'text-ink-500'}>{tab.label}</span>
              {active && (
                <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-lilac-400 shadow-md shadow-lilac-400/50 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </Layout>
  )
}

