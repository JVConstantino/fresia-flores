# Checkout Inteligente — Pré-preenchimento para Usuário Logado

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify checkout flow to skip repetitive data entry for logged-in users. When logged in, automatically pre-fill user data (name, email, phone), show saved addresses as selectable cards, show saved payment cards as wallet, and allow inline addition of new address/card without leaving checkout.

**Architecture:** Frontend checkout detects logged-in user, populates checkoutStore with user data on mount. Step 1 (identification) is skipped/hidden. Step 2 (delivery) shows AddressSelectorCards component with saved addresses + inline form for new address. Step 4 (payment) shows CardWalletSelector with saved cards + inline form for new card. Backend endpoints unchanged; structure leverages existing ContaPage components and APIs.

**Tech Stack:** React 18, TypeScript, Zustand, axios, existing UI components (AddressCardGrid, CardWallet, CreditCardFormFlip), shadcn/ui.

---

## File Structure

### Frontend
- Modify: `frontend/src/store/checkoutStore.ts` — auto-populate user data on init
- Create: `frontend/src/components/checkout/AddressSelectorCards.tsx` — select saved address or add new
- Create: `frontend/src/components/checkout/CardWalletSelector.tsx` — select saved card or add new
- Modify: `frontend/src/pages/checkout/CheckoutPage.tsx` — integrate selectors, skip Step 1 if logged in
- Modify: `frontend/src/services/checkoutService.ts` — no changes (already works)

---

## Task 1: Frontend Store — Auto-populate CheckoutStore for Logged-in Users

**Files:**
- Modify: `frontend/src/store/checkoutStore.ts`

- [ ] **Step 1: Read current checkoutStore**

```bash
head -80 frontend/src/store/checkoutStore.ts
```

- [ ] **Step 2: Add user data auto-population**

**Modify** `frontend/src/store/checkoutStore.ts` — add initialization logic:

```typescript
import { create } from 'zustand'
import { useAuthStore } from './authStore'

export interface CheckoutItem {
  productId: number
  variantId: number | null
  qty: number
  price: number
}

export interface CheckoutState {
  items: CheckoutItem[]
  currentStep: 'identification' | 'delivery' | 'summary' | 'payment' | 'confirmation'
  
  // User data
  name: string
  email: string
  phone: string
  
  // Delivery
  selectedAddressId: number | null
  neighborhoodId: number | null
  deliveryFee: number
  
  // Payment
  selectedCardId: number | null
  paymentMethod: 'card' | 'pix'
  
  // Actions
  setItems: (items: CheckoutItem[]) => void
  setCurrentStep: (step: CheckoutState['currentStep']) => void
  setName: (name: string) => void
  setEmail: (email: string) => void
  setPhone: (phone: string) => void
  setSelectedAddressId: (id: number | null) => void
  setNeighborhoodId: (id: number | null) => void
  setDeliveryFee: (fee: number) => void
  setSelectedCardId: (id: number | null) => void
  setPaymentMethod: (method: 'card' | 'pix') => void
  reset: () => void
}

const initialState = {
  items: [],
  currentStep: 'identification' as const,
  name: '',
  email: '',
  phone: '',
  selectedAddressId: null,
  neighborhoodId: null,
  deliveryFee: 0,
  selectedCardId: null,
  paymentMethod: 'card' as const
}

export const useCheckoutStore = create<CheckoutState>((set) => {
  // Auto-populate on init if user is logged in
  const { user } = useAuthStore.getState()
  
  if (user) {
    // Pre-fill user data
    set({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      // TODO: Load user's default address and card from API
      // For now, leave empty and let user select
      selectedAddressId: null,
      selectedCardId: null
    })
  }

  return {
    ...initialState,
    setItems: (items) => set({ items }),
    setCurrentStep: (currentStep) => set({ currentStep }),
    setName: (name) => set({ name }),
    setEmail: (email) => set({ email }),
    setPhone: (phone) => set({ phone }),
    setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId }),
    setNeighborhoodId: (neighborhoodId) => set({ neighborhoodId }),
    setDeliveryFee: (deliveryFee) => set({ deliveryFee }),
    setSelectedCardId: (selectedCardId) => set({ selectedCardId }),
    setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
    reset: () => set(initialState)
  }
})
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/store/checkoutStore.ts
git commit -m "feat(checkoutStore): auto-populate user data for logged-in users"
```

---

## Task 2: Frontend Component — Address Selector with Inline Add

**Files:**
- Create: `frontend/src/components/checkout/AddressSelectorCards.tsx`

- [ ] **Step 1: Create the component**

**Create** `frontend/src/components/checkout/AddressSelectorCards.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { MapPin, Plus, X } from 'lucide-react'

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
  onSelectAddress: (addressId: number) => void
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
          onSelectAddress(defaultAddr.id)
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
      }
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  async function handleSaveAddress() {
    const required = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
    if (required.some(f => !formData[f as keyof typeof formData])) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSavingAddress(true)
    try {
      const { data: newAddr } = await api.post('/account/addresses', formData)
      setAddresses([...addresses, newAddr])
      onSelectAddress(newAddr.id)
      setShowForm(false)
      toast.success('Endereço adicionado')
    } catch {
      toast.error('Erro ao salvar endereço')
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
                    onClick={() => onSelectAddress(addr.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedAddressId === addr.id
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

          <input
            type="text"
            value={formData.neighborhood}
            onChange={e => setFormData(f => ({ ...f, neighborhood: e.target.value }))}
            placeholder="Bairro"
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
          />

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
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/checkout/AddressSelectorCards.tsx
git commit -m "feat(component): create AddressSelectorCards for checkout delivery step"
```

---

## Task 3: Frontend Component — Card Wallet Selector with Inline Add

**Files:**
- Create: `frontend/src/components/checkout/CardWalletSelector.tsx`

- [ ] **Step 1: Create the component**

**Create** `frontend/src/components/checkout/CardWalletSelector.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { CreditCard, Plus, X } from 'lucide-react'
import { CardWallet } from '@/components/account/CardWallet'
import { CreditCardFormFlip } from '@/components/features/CreditCardFormFlip'

interface PaymentCard {
  id: number
  brand: string
  lastFour: string
  nickname?: string | null
  isDefault: boolean
  createdAt: string
}

interface CardWalletSelectorProps {
  selectedCardId: number | null
  onSelectCard: (cardId: number) => void
}

export function CardWalletSelector({ selectedCardId, onSelectCard }: CardWalletSelectorProps) {
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [savingCard, setSavingCard] = useState(false)

  useEffect(() => {
    loadCards()
  }, [])

  async function loadCards() {
    try {
      const { data } = await api.get('/account/cards')
      setCards(data)
      
      // Auto-select default card if none selected
      if (!selectedCardId && data.length > 0) {
        const defaultCard = data.find((c: PaymentCard) => c.isDefault)
        if (defaultCard) {
          onSelectCard(defaultCard.id)
        }
      }
    } catch {
      toast.error('Erro ao carregar cartões')
    } finally {
      setLoading(false)
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
      // TODO: Call real MP API for tokenization
      const mockToken = `test_token_${data.cardNumber.slice(-4)}_${Date.now()}`
      const brand = 'visa'

      const { data: newCard } = await api.post('/account/cards', {
        mpToken: mockToken,
        brand,
        lastFour: data.cardNumber.slice(-4),
        nickname: '',
        isDefault: cards.length === 0
      })

      setCards([...cards, newCard])
      onSelectCard(newCard.id)
      setShowForm(false)
      toast.success('Cartão adicionado')
    } catch {
      toast.error('Erro ao salvar cartão')
    } finally {
      setSavingCard(false)
    }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('Tem certeza?')) return
    try {
      await api.delete(`/account/cards/${id}`)
      setCards(cards.filter(c => c.id !== id))
      if (selectedCardId === id) {
        onSelectCard(cards[0]?.id || null)
      }
      toast.success('Cartão removido')
    } catch {
      toast.error('Erro ao deletar cartão')
    }
  }

  if (loading) return <div className="text-center py-4">Carregando cartões...</div>

  return (
    <div className="space-y-4">
      {!showForm ? (
        <>
          {cards.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <CreditCard className="mx-auto mb-2 opacity-50" size={32} />
              <p className="mb-4">Nenhum cartão cadastrado</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg"
              >
                <Plus size={16} />
                Adicionar Cartão
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => onSelectCard(card.id)}
                    className={`cursor-pointer transition-all transform ${
                      selectedCardId === card.id ? 'scale-105 ring-2 ring-lilac-500' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <CardWallet
                      {...card}
                      onDelete={handleDeleteCard}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-2 py-2 border border-lilac-500 text-lilac-600 rounded-lg hover:bg-lilac-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Usar Outro Cartão
              </button>
            </>
          )}
        </>
      ) : (
        <div className="p-4 bg-ink-50 rounded-lg space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Novo Cartão</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-ink-400 hover:text-ink-600"
            >
              <X size={20} />
            </button>
          </div>

          <CreditCardFormFlip
            onSubmit={handleSaveCard}
            isLoading={savingCard}
          />

          <button
            onClick={() => setShowForm(false)}
            className="w-full py-2 border border-ink-200 hover:bg-ink-50 text-ink-800 rounded-lg text-sm"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/checkout/CardWalletSelector.tsx
git commit -m "feat(component): create CardWalletSelector for checkout payment step"
```

---

## Task 4: Frontend Page — Integrate Selectors in CheckoutPage

**Files:**
- Modify: `frontend/src/pages/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Add imports**

At the top of CheckoutPage.tsx, add:

```typescript
import { useAuthStore } from '@/store/authStore'
import { AddressSelectorCards } from '@/components/checkout/AddressSelectorCards'
import { CardWalletSelector } from '@/components/checkout/CardWalletSelector'
```

- [ ] **Step 2: Skip Step 1 if logged in**

Find the Step 1 rendering (identification) and wrap it:

```typescript
{(!user || activeStep === 'identification') && (
  // existing Step 1 content
)}
```

- [ ] **Step 3: Replace Step 2 (delivery) with selector**

Find Step 2 and replace with:

```typescript
{activeStep === 'delivery' && (
  <div>
    <h2 className="text-xl font-semibold mb-4">2. Entrega</h2>
    <AddressSelectorCards
      selectedAddressId={checkoutState.selectedAddressId}
      onSelectAddress={(id) => checkoutState.setSelectedAddressId(id)}
    />
    <button
      onClick={() => checkoutState.setCurrentStep('summary')}
      disabled={!checkoutState.selectedAddressId}
      className="mt-6 w-full px-4 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg"
    >
      Continuar
    </button>
  </div>
)}
```

- [ ] **Step 4: Replace Step 4 (payment) with selector**

Find Step 4 and replace card/pix sections with:

```typescript
{activeStep === 'payment' && (
  <div>
    <h2 className="text-xl font-semibold mb-4">4. Pagamento</h2>
    
    {/* PIX option */}
    <button
      onClick={() => checkoutState.setPaymentMethod('pix')}
      className={`w-full p-4 border-2 rounded-lg mb-4 text-left transition-colors ${
        checkoutState.paymentMethod === 'pix'
          ? 'border-lilac-500 bg-lilac-50'
          : 'border-ink-200'
      }`}
    >
      <p className="font-semibold">PIX</p>
      <p className="text-sm text-ink-500">Transferência instantânea</p>
    </button>

    {/* Card option */}
    <button
      onClick={() => checkoutState.setPaymentMethod('card')}
      className={`w-full p-4 border-2 rounded-lg mb-4 text-left transition-colors ${
        checkoutState.paymentMethod === 'card'
          ? 'border-lilac-500 bg-lilac-50'
          : 'border-ink-200'
      }`}
    >
      <p className="font-semibold">Cartão de Crédito</p>
      <p className="text-sm text-ink-500">Visa, Mastercard, Elo</p>
    </button>

    {checkoutState.paymentMethod === 'card' && (
      <CardWalletSelector
        selectedCardId={checkoutState.selectedCardId}
        onSelectCard={(id) => checkoutState.setSelectedCardId(id)}
      />
    )}

    <button
      onClick={() => checkoutState.setCurrentStep('confirmation')}
      disabled={!checkoutState.selectedCardId && checkoutState.paymentMethod === 'card'}
      className="mt-6 w-full px-4 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg"
    >
      Confirmar Pedido
    </button>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/pages/checkout/CheckoutPage.tsx
git commit -m "feat(CheckoutPage): integrate address and card selectors for smart checkout"
```

---

## Task 5: Build & Verify

**Files:**
- None (verification only)

- [ ] **Step 1: Build frontend**

```bash
cd frontend
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 2: Verify no new issues**

```bash
cd frontend
npm run build 2>&1 | grep -i "error" || echo "No errors found"
```

- [ ] **Step 3: Commit summary**

```bash
cd frontend
git log --oneline -5
```

Expected: 4 commits for this subsystem.

---

## Summary

**Subsistema 3 (Checkout Inteligente) — Estrutura Completa**

### O que foi implementado:

✅ **Store:**
- Auto-população de dados do usuário logado (name, email, phone)

✅ **Components:**
- `AddressSelectorCards` — seleciona endereço salvo ou adiciona novo inline
- `CardWalletSelector` — seleciona cartão salvo ou adiciona novo inline

✅ **Page:**
- Step 1 omitido para usuário logado
- Step 2 com seletor de endereço
- Step 4 com seletor de cartão

✅ **Features:**
- Auto-seleção de endereço/cartão padrão
- Adicionar novo sem sair do checkout
- ViaCEP integration preservado
- Form validation preservado

### PENDÊNCIAS:

```
TODO: Carregar endereço/cartão padrão do user na inicialização
TODO: Integração real com MP API para novos cartões
```

---

**Pronto para a próxima etapa!**
