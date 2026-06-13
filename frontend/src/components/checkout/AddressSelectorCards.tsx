import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { MapPin, Plus, X } from 'lucide-react'
import { neighborhoodService, type Neighborhood } from '@/services/neighborhoodService'

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

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

interface AddressSelectorCardsProps {
  selectedAddressId: number | null
  onSelectAddress: (addressId: number, address: Address) => void
}

export function AddressSelectorCards({ selectedAddressId, onSelectAddress }: AddressSelectorCardsProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  })
  const [loadingCep, setLoadingCep] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<Neighborhood[]>([])

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    try {
      const { data } = await api.get('/account/addresses')
      setAddresses(data)

      // Auto-select default address if none selected
      if (!selectedAddressId && data.length > 0) {
        const defaultAddr = data.find((a: Address) => a.isDefault)
        if (defaultAddr) {
          onSelectAddress(defaultAddr.id, defaultAddr)
        }
      }
    } catch {
      toast.error('Erro ao carregar endereços')
    } finally {
      setLoading(false)
    }
  }

  async function handleCepBlur() {
    const cep = formData.zipCode.replace(/\D/g, '')
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        toast.error('CEP não encontrado')
      } else {
        setFormData(f => ({
          ...f,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
        // Após preencher cidade, tentar buscar bairros cadastrados (área de entrega)
        await loadNeighborhoodsForCity(data.localidade, data.uf, data.bairro)
      }
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  async function loadNeighborhoodsForCity(cityName: string, state: string, currentBairro?: string) {
    try {
      const cities = await neighborhoodService.getCities()
      const match = cities.find(c =>
        c.name.toLowerCase() === cityName.toLowerCase() &&
        c.state.toLowerCase() === state.toLowerCase()
      )
      if (match) {
        const nbhs = await neighborhoodService.getNeighborhoods(match.id)
        setAvailableNeighborhoods(nbhs)
        // Se o bairro vindo do ViaCEP existe na lista, manter; senão, limpar
        if (currentBairro && nbhs.length > 0) {
          const matched = nbhs.find(n =>
            n.name.toLowerCase() === currentBairro.toLowerCase() ||
            currentBairro.toLowerCase().includes(n.name.toLowerCase())
          )
          if (matched) {
            setFormData(f => ({ ...f, neighborhood: matched.name }))
          } else {
            // Bairro do CEP não está na área de entrega — limpar para forçar escolha
            setFormData(f => ({ ...f, neighborhood: '' }))
          }
        }
      } else {
        setAvailableNeighborhoods([])
      }
    } catch {
      setAvailableNeighborhoods([])
    }
  }

  async function handleSaveAddress() {
    const required = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
    const missing = required.filter(f => !formData[f as keyof typeof formData])
    if (missing.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios: ${missing.join(', ')}`)
      return
    }

    setSavingAddress(true)
    try {
      const { data: newAddr } = await api.post('/account/addresses', formData)
      setAddresses([...addresses, newAddr])
      onSelectAddress(newAddr.id, newAddr)
      setShowForm(false)
      toast.success('Endereço adicionado')
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao salvar endereço'
      toast.error(message)
    } finally {
      setSavingAddress(false)
    }
  }

  if (loading) return <div className="text-center py-4">Carregando endereços...</div>

  return (
    <div className="space-y-4">
      {!showForm ? (
        <>
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <MapPin className="mx-auto mb-2 opacity-50" size={32} />
              <p className="mb-4">Nenhum endereço cadastrado</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg"
              >
                <Plus size={16} />
                Adicionar Endereço
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => onSelectAddress(addr.id, addr)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${selectedAddressId === addr.id
                        ? 'border-lilac-500 bg-lilac-50'
                        : 'border-ink-200 hover:border-ink-300'
                      }`}
                  >
                    {addr.isDefault && (
                      <p className="text-xs font-semibold text-lilac-600 mb-1">● PADRÃO</p>
                    )}
                    <p className="font-semibold text-ink-800">
                      {addr.street}, {addr.number}
                    </p>
                    {addr.complement && (
                      <p className="text-sm text-ink-600">{addr.complement}</p>
                    )}
                    <p className="text-sm text-ink-600">
                      {addr.neighborhood}, {addr.city} - {addr.state}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-2 py-2 border border-lilac-500 text-lilac-600 rounded-lg hover:bg-lilac-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Novo Endereço
              </button>
            </>
          )}
        </>
      ) : (
        <div className="p-4 bg-ink-50 rounded-lg space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Novo Endereço</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-ink-400 hover:text-ink-600"
            >
              <X size={20} />
            </button>
          </div>

          <input
            type="text"
            value={formData.zipCode}
            onChange={e => setFormData(f => ({ ...f, zipCode: e.target.value }))}
            onBlur={handleCepBlur}
            placeholder="CEP"
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
          />
          {loadingCep && <p className="text-xs text-ink-500">Buscando...</p>}

          <input
            type="text"
            value={formData.street}
            onChange={e => setFormData(f => ({ ...f, street: e.target.value }))}
            placeholder="Rua"
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={formData.number}
              onChange={e => setFormData(f => ({ ...f, number: e.target.value }))}
              placeholder="Número"
              className="px-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
            <input
              type="text"
              value={formData.complement}
              onChange={e => setFormData(f => ({ ...f, complement: e.target.value }))}
              placeholder="Complemento"
              className="px-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
          </div>

          {availableNeighborhoods.length > 0 ? (
            <div>
              <select
                value={formData.neighborhood}
                onChange={e => setFormData(f => ({ ...f, neighborhood: e.target.value }))}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione o bairro de entrega...</option>
                {availableNeighborhoods.map(n => (
                  <option key={n.id} value={n.name}>
                    {n.name} — Frete {formatPrice(Number(n.deliveryFee))}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-lilac-600 mt-1">✓ Cidade na nossa área de entrega — escolha o bairro para calcular o frete</p>
            </div>
          ) : (
            <input
              type="text"
              value={formData.neighborhood}
              onChange={e => setFormData(f => ({ ...f, neighborhood: e.target.value }))}
              placeholder="Bairro"
              className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={formData.city}
              onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
              placeholder="Cidade"
              className="px-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
            <input
              type="text"
              value={formData.state}
              onChange={e => setFormData(f => ({ ...f, state: e.target.value }))}
              placeholder="Estado"
              className="px-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveAddress}
              disabled={savingAddress}
              className="flex-1 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg text-sm font-semibold"
            >
              {savingAddress ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-ink-200 hover:bg-ink-50 text-ink-800 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
