# Painel do Cliente Expandido — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir o painel `/conta` com sidebar + 5 seções: Pedidos, Meus Dados, Alterar Senha, Endereços (CRUD completo + ViaCEP), e Cartões (metadados).

**Architecture:** Backend recebe novos endpoints em `account.ts` com dois novos controllers (`addressController`, `cardController`) e dois novos métodos em `authController` (`updateProfile`, `updatePassword`). O modelo `PaymentCard` é adicionado ao schema Prisma. O frontend tem `ContaPage.tsx` totalmente reescrito com layout sidebar + área de conteúdo.

**Tech Stack:** Express 5 + Prisma (MySQL) no backend; React 18 + react-hook-form + zod + sonner no frontend; ViaCEP (fetch público) para autopreenchimento de CEP.

---

## Mapa de Arquivos

| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Adicionar model `PaymentCard` + relação em `User` |
| `backend/src/controllers/authController.ts` | Adicionar `updateProfile` e `updatePassword` |
| `backend/src/controllers/addressController.ts` | Criar — CRUD completo de endereços |
| `backend/src/controllers/cardController.ts` | Criar — CRUD de cartões (metadados) |
| `backend/src/routes/account.ts` | Adicionar todas as rotas novas |
| `frontend/src/pages/account/ContaPage.tsx` | Reescrever completo |

---

## Task 1: Adicionar PaymentCard no schema Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Adicionar model PaymentCard e relação em User**

Abrir `backend/prisma/schema.prisma`. Após o model `Address`, adicionar:

```prisma
model PaymentCard {
  id        Int      @id @default(autoincrement())
  userId    Int
  brand     String
  lastFour  String
  nickname  String?
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

No model `User`, adicionar a linha de relação depois de `wishlist Wishlist[]`:

```prisma
  paymentCards PaymentCard[]
```

- [ ] **Step 2: Gerar migration e client**

```bash
cd backend
npx prisma migrate dev --name add_payment_card
npx prisma generate
```

Saída esperada: `Your database is now in sync with your schema.`

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add PaymentCard model and user relation"
```

---

## Task 2: Endpoints de Perfil e Senha no authController

**Files:**
- Modify: `backend/src/controllers/authController.ts`
- Modify: `backend/src/services/authService.ts`

- [ ] **Step 1: Adicionar updateProfile e updatePassword no authService**

No final do objeto `authService` em `backend/src/services/authService.ts`, antes do fechamento `}`:

```typescript
  async updateProfile(
    userId: number,
    data: { name: string; phone?: string }
  ): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, phone: data.phone ?? null },
      select: { id: true, name: true, email: true, phone: true, isAdmin: true },
    })
    return user
  },

  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 })
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw Object.assign(new Error('Senha atual incorreta'), { statusCode: 400 })
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  },
```

- [ ] **Step 2: Adicionar handlers no authController**

No final do objeto `authController` em `backend/src/controllers/authController.ts`, antes do fechamento `}`:

```typescript
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { name, phone } = req.body
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Nome é obrigatório' })
      }
      const user = await authService.updateProfile(userId, { name, phone })
      res.json(user)
    } catch (err) {
      next(err)
    }
  },

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { currentPassword, newPassword } = req.body
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senhas são obrigatórias' })
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
      }
      await authService.updatePassword(userId, currentPassword, newPassword)
      res.json({ message: 'Senha atualizada com sucesso' })
    } catch (err) {
      next(err)
    }
  },
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/authController.ts backend/src/services/authService.ts
git commit -m "feat(account): add updateProfile and updatePassword handlers"
```

---

## Task 3: Controller de Endereços

**Files:**
- Create: `backend/src/controllers/addressController.ts`

- [ ] **Step 1: Criar addressController.ts**

Criar arquivo `backend/src/controllers/addressController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

export const addressController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
      })
      res.json(addresses)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body
      if (!street || !number || !neighborhood || !city || !state || !zipCode) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' })
      }
      if (isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const address = await prisma.address.create({
        data: { userId, street, number, complement: complement || null, neighborhood, city, state, zipCode, isDefault: !!isDefault },
      })
      res.status(201).json(address)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const id = Number(req.params.id)
      const existing = await prisma.address.findFirst({ where: { id, userId } })
      if (!existing) return res.status(404).json({ error: 'Endereço não encontrado' })
      const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body
      if (isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const address = await prisma.address.update({
        where: { id },
        data: { street, number, complement: complement || null, neighborhood, city, state, zipCode, isDefault: !!isDefault },
      })
      res.json(address)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const id = Number(req.params.id)
      const existing = await prisma.address.findFirst({ where: { id, userId } })
      if (!existing) return res.status(404).json({ error: 'Endereço não encontrado' })
      await prisma.address.delete({ where: { id } })
      res.json({ message: 'Endereço removido' })
    } catch (err) {
      next(err)
    }
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/addressController.ts
git commit -m "feat(account): add addressController with CRUD"
```

---

## Task 4: Controller de Cartões

**Files:**
- Create: `backend/src/controllers/cardController.ts`

- [ ] **Step 1: Criar cardController.ts**

Criar arquivo `backend/src/controllers/cardController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

export const cardController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const cards = await prisma.paymentCard.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      })
      res.json(cards)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { brand, lastFour, nickname, isDefault } = req.body
      if (!brand || !lastFour || lastFour.length !== 4 || !/^\d{4}$/.test(lastFour)) {
        return res.status(400).json({ error: 'Bandeira e últimos 4 dígitos são obrigatórios' })
      }
      if (isDefault) {
        await prisma.paymentCard.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const card = await prisma.paymentCard.create({
        data: { userId, brand, lastFour, nickname: nickname || null, isDefault: !!isDefault },
      })
      res.status(201).json(card)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const id = Number(req.params.id)
      const existing = await prisma.paymentCard.findFirst({ where: { id, userId } })
      if (!existing) return res.status(404).json({ error: 'Cartão não encontrado' })
      await prisma.paymentCard.delete({ where: { id } })
      res.json({ message: 'Cartão removido' })
    } catch (err) {
      next(err)
    }
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/cardController.ts
git commit -m "feat(account): add cardController for payment card metadata"
```

---

## Task 5: Registrar todas as rotas em account.ts

**Files:**
- Modify: `backend/src/routes/account.ts`

- [ ] **Step 1: Reescrever account.ts com todas as rotas**

Substituir o conteúdo completo de `backend/src/routes/account.ts` por:

```typescript
import { Router } from 'express'
import { authMiddleware } from '@/middlewares/authMiddleware'
import { authController } from '@/controllers/authController'
import { wishlistController } from '@/controllers/wishlistController'
import { addressController } from '@/controllers/addressController'
import { cardController } from '@/controllers/cardController'

const router = Router()

router.use(authMiddleware)

// Perfil
router.patch('/profile', authController.updateProfile)

// Senha
router.patch('/password', authController.updatePassword)

// Endereços
router.get('/addresses', addressController.list)
router.post('/addresses', addressController.create)
router.put('/addresses/:id', addressController.update)
router.delete('/addresses/:id', addressController.remove)

// Cartões
router.get('/cards', cardController.list)
router.post('/cards', cardController.create)
router.delete('/cards/:id', cardController.remove)

// Wishlist
router.get('/wishlist', wishlistController.getWishlist)
router.post('/wishlist/:productId', wishlistController.addToWishlist)
router.delete('/wishlist/:productId', wishlistController.removeFromWishlist)
router.post('/wishlist/sync', wishlistController.syncWishlist)

export default router
```

- [ ] **Step 2: Reiniciar backend e verificar rotas**

```bash
# Na pasta backend:
npm run dev
```

Testar com curl (substitua o cookie real após login):
```bash
curl -X PATCH http://localhost:4000/api/v1/account/profile \
  -H "Content-Type: application/json" \
  -b "token=SEU_TOKEN" \
  -d '{"name":"Teste","phone":"11999999999"}'
# Esperado: {"id":...,"name":"Teste","email":"...","phone":"11999999999","isAdmin":false}

curl http://localhost:4000/api/v1/account/addresses \
  -b "token=SEU_TOKEN"
# Esperado: []
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/account.ts
git commit -m "feat(account): register profile, password, addresses, cards routes"
```

---

## Task 6: Reescrever ContaPage.tsx

**Files:**
- Modify: `frontend/src/pages/account/ContaPage.tsx`

- [ ] **Step 1: Reescrever ContaPage.tsx completo**

Substituir o conteúdo completo de `frontend/src/pages/account/ContaPage.tsx` por:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { orderService } from '@/services/orderService'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Package, User, Lock, MapPin, CreditCard, LogOut, Plus, Trash2, Star, ChevronRight } from 'lucide-react'

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
}

const BRAND_COLORS: Record<string, string> = {
  visa: 'from-blue-700 to-blue-500',
  mastercard: 'from-red-700 to-orange-500',
  elo: 'from-yellow-600 to-yellow-400',
  hipercard: 'from-red-800 to-red-600',
  amex: 'from-green-700 to-green-500',
}

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo', hipercard: 'Hipercard', amex: 'Amex',
}

export function ContaPage() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('orders')

  // Orders
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Profile
  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({ zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', isDefault: false })
  const [loadingCep, setLoadingCep] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  // Cards
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ brand: 'visa', lastFour: '', nickname: '', isDefault: false })
  const [savingCard, setSavingCard] = useState(false)

  useEffect(() => {
    if (activeTab === 'orders') loadOrders()
    if (activeTab === 'addresses') loadAddresses()
    if (activeTab === 'cards') loadCards()
  }, [activeTab])

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const data = await orderService.findMyOrders()
      setOrders(data)
    } catch { toast.error('Erro ao carregar pedidos') }
    finally { setLoadingOrders(false) }
  }

  async function loadAddresses() {
    try {
      const { data } = await api.get('/account/addresses')
      setAddresses(data)
    } catch { toast.error('Erro ao carregar endereços') }
  }

  async function loadCards() {
    try {
      const { data } = await api.get('/account/cards')
      setCards(data)
    } catch { toast.error('Erro ao carregar cartões') }
  }

  async function handleSaveProfile() {
    if (!profileName.trim()) { toast.error('Nome é obrigatório'); return }
    setSavingProfile(true)
    try {
      const { data } = await api.patch('/account/profile', { name: profileName, phone: profilePhone })
      setUser({ ...user!, name: data.name, phone: data.phone })
      toast.success('Perfil atualizado!')
    } catch { toast.error('Erro ao atualizar perfil') }
    finally { setSavingProfile(false) }
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Preencha todos os campos'); return }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    if (newPassword.length < 6) { toast.error('Nova senha deve ter pelo menos 6 caracteres'); return }
    setSavingPassword(true)
    try {
      await api.patch('/account/password', { currentPassword, newPassword })
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao alterar senha')
    }
    finally { setSavingPassword(false) }
  }

  async function handleCepBlur() {
    const cep = addressForm.zipCode.replace(/\D/g, '')
    if (cep.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) { toast.error('CEP não encontrado'); return }
      setAddressForm(f => ({ ...f, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }))
    } catch { toast.error('Erro ao buscar CEP') }
    finally { setLoadingCep(false) }
  }

  function openAddressForm(address?: Address) {
    if (address) {
      setEditingAddress(address)
      setAddressForm({ zipCode: address.zipCode, street: address.street, number: address.number, complement: address.complement ?? '', neighborhood: address.neighborhood, city: address.city, state: address.state, isDefault: address.isDefault })
    } else {
      setEditingAddress(null)
      setAddressForm({ zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', isDefault: false })
    }
    setShowAddressForm(true)
  }

  async function handleSaveAddress() {
    const { zipCode, street, number, neighborhood, city, state } = addressForm
    if (!zipCode || !street || !number || !neighborhood || !city || !state) { toast.error('Preencha todos os campos obrigatórios'); return }
    setSavingAddress(true)
    try {
      if (editingAddress) {
        const { data } = await api.put(`/account/addresses/${editingAddress.id}`, addressForm)
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? data : (addressForm.isDefault ? { ...a, isDefault: false } : a)))
      } else {
        const { data } = await api.post('/account/addresses', addressForm)
        setAddresses(prev => addressForm.isDefault ? [...prev.map(a => ({ ...a, isDefault: false })), data] : [...prev, data])
      }
      toast.success(editingAddress ? 'Endereço atualizado!' : 'Endereço adicionado!')
      setShowAddressForm(false)
    } catch { toast.error('Erro ao salvar endereço') }
    finally { setSavingAddress(false) }
  }

  async function handleDeleteAddress(id: number) {
    try {
      await api.delete(`/account/addresses/${id}`)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast.success('Endereço removido')
    } catch { toast.error('Erro ao remover endereço') }
  }

  async function handleSaveCard() {
    if (!cardForm.brand || !cardForm.lastFour || cardForm.lastFour.length !== 4) { toast.error('Preencha bandeira e últimos 4 dígitos'); return }
    setSavingCard(true)
    try {
      const { data } = await api.post('/account/cards', cardForm)
      setCards(prev => cardForm.isDefault ? [...prev.map(c => ({ ...c, isDefault: false })), data] : [...prev, data])
      toast.success('Cartão salvo!')
      setShowCardForm(false)
      setCardForm({ brand: 'visa', lastFour: '', nickname: '', isDefault: false })
    } catch { toast.error('Erro ao salvar cartão') }
    finally { setSavingCard(false) }
  }

  async function handleDeleteCard(id: number) {
    try {
      await api.delete(`/account/cards/${id}`)
      setCards(prev => prev.filter(c => c.id !== id))
      toast.success('Cartão removido')
    } catch { toast.error('Erro ao remover cartão') }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
    preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-700' },
    delivering: { label: 'Em trânsito', color: 'bg-orange-100 text-orange-700' },
    delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  }

  const navItems = [
    { id: 'orders' as Tab, icon: Package, label: 'Meus Pedidos' },
    { id: 'profile' as Tab, icon: User, label: 'Meus Dados' },
    { id: 'password' as Tab, icon: Lock, label: 'Alterar Senha' },
    { id: 'addresses' as Tab, icon: MapPin, label: 'Endereços' },
    { id: 'cards' as Tab, icon: CreditCard, label: 'Cartões' },
  ]

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-[240px_1fr] gap-6 items-start">

          {/* Sidebar */}
          <aside className="bg-white border border-ink-200 rounded-2xl overflow-hidden sticky top-24">
            {/* Avatar */}
            <div className="bg-gradient-to-br from-lilac-100 to-petal-100 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-lilac-500 text-white flex items-center justify-center text-xl font-semibold mx-auto mb-3">
                {initials}
              </div>
              <p className="font-semibold text-ink-800 text-sm">{user?.name}</p>
              <p className="text-xs text-ink-500 mt-0.5 truncate">{user?.email}</p>
            </div>

            {/* Nav */}
            <nav className="p-2">
              {navItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors mb-0.5 ${
                    activeTab === id
                      ? 'bg-lilac-500 text-white font-medium'
                      : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab !== id && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors mt-2"
              >
                <LogOut size={16} />
                Sair
              </button>
            </nav>
          </aside>

          {/* Conteúdo */}
          <main className="bg-white border border-ink-200 rounded-2xl p-8">

            {/* --- PEDIDOS --- */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="font-display italic text-2xl text-ink-800 mb-6">Meus Pedidos</h2>
                {loadingOrders ? (
                  <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-ink-100 rounded-xl animate-pulse" />)}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package size={48} className="text-ink-300 mx-auto mb-4" />
                    <p className="text-ink-500">Você ainda não fez nenhum pedido.</p>
                    <Button onClick={() => navigate('/loja')} className="mt-4 bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl">Ir para a loja</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => {
                      const s = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-ink-100 text-ink-600' }
                      return (
                        <div key={order.id} className="border border-ink-200 rounded-xl p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-ink-800 text-sm">Pedido #{order.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                          </div>
                          <p className="text-xs text-ink-500 mb-1">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm text-ink-700 font-medium">R$ {Number(order.total).toFixed(2).replace('.', ',')}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- MEUS DADOS --- */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="font-display italic text-2xl text-ink-800 mb-6">Meus Dados</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Nome completo</label>
                    <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">E-mail</label>
                    <Input value={user?.email ?? ''} disabled className="bg-ink-50 text-ink-400 cursor-not-allowed" />
                    <p className="text-xs text-ink-400 mt-1">O e-mail não pode ser alterado.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Telefone</label>
                    <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl">
                    {savingProfile ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              </div>
            )}

            {/* --- ALTERAR SENHA --- */}
            {activeTab === 'password' && (
              <div>
                <h2 className="font-display italic text-2xl text-ink-800 mb-6">Alterar Senha</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Senha atual</label>
                    <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Nova senha</label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Confirmar nova senha</label>
                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button onClick={handleSavePassword} disabled={savingPassword} className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl">
                    {savingPassword ? 'Alterando...' : 'Alterar senha'}
                  </Button>
                </div>
              </div>
            )}

            {/* --- ENDEREÇOS --- */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display italic text-2xl text-ink-800">Endereços</h2>
                  {!showAddressForm && (
                    <Button onClick={() => openAddressForm()} size="sm" className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl gap-1">
                      <Plus size={14} /> Novo endereço
                    </Button>
                  )}
                </div>

                {showAddressForm ? (
                  <div className="bg-ink-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-ink-800 text-sm">{editingAddress ? 'Editar endereço' : 'Novo endereço'}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">CEP *</label>
                        <Input
                          value={addressForm.zipCode}
                          onChange={e => setAddressForm(f => ({ ...f, zipCode: e.target.value }))}
                          onBlur={handleCepBlur}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        {loadingCep && <p className="text-xs text-lilac-500 mt-1">Buscando CEP...</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Número *</label>
                        <Input value={addressForm.number} onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))} placeholder="123" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1.5">Logradouro *</label>
                      <Input value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))} placeholder="Rua, Av, etc" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Complemento</label>
                        <Input value={addressForm.complement} onChange={e => setAddressForm(f => ({ ...f, complement: e.target.value }))} placeholder="Apto, Bloco..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Bairro *</label>
                        <Input value={addressForm.neighborhood} onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))} placeholder="Bairro" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Cidade *</label>
                        <Input value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} placeholder="São Paulo" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Estado *</label>
                        <Input value={addressForm.state} onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))} placeholder="SP" maxLength={2} />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
                      Definir como endereço padrão
                    </label>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveAddress} disabled={savingAddress} className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl">
                        {savingAddress ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button onClick={() => setShowAddressForm(false)} variant="outline" className="rounded-xl">Cancelar</Button>
                    </div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin size={40} className="text-ink-300 mx-auto mb-3" />
                    <p className="text-ink-500 text-sm">Nenhum endereço cadastrado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(address => (
                      <div key={address.id} className="border border-ink-200 rounded-xl p-5 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="text-lilac-500 mt-0.5 flex-shrink-0" />
                          <div>
                            {address.isDefault && (
                              <span className="inline-block text-xs bg-lilac-100 text-lilac-600 font-semibold px-2 py-0.5 rounded-full mb-1">Padrão</span>
                            )}
                            <p className="text-sm text-ink-800">{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ''}</p>
                            <p className="text-xs text-ink-500">{address.neighborhood} — {address.city}/{address.state} · {address.zipCode}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => openAddressForm(address)} className="text-xs text-lilac-500 hover:text-lilac-700 font-medium">Editar</button>
                          {addresses.length > 1 && (
                            <button onClick={() => handleDeleteAddress(address.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- CARTÕES --- */}
            {activeTab === 'cards' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display italic text-2xl text-ink-800">Cartões</h2>
                  {!showCardForm && (
                    <Button onClick={() => setShowCardForm(true)} size="sm" className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl gap-1">
                      <Plus size={14} /> Novo cartão
                    </Button>
                  )}
                </div>

                {showCardForm ? (
                  <div className="bg-ink-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-ink-800 text-sm">Adicionar cartão</h3>
                    <p className="text-xs text-ink-400">Salvamos apenas os metadados (bandeira e últimos 4 dígitos) — nunca o número completo.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Bandeira *</label>
                        <select
                          value={cardForm.brand}
                          onChange={e => setCardForm(f => ({ ...f, brand: e.target.value }))}
                          className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                        >
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="elo">Elo</option>
                          <option value="hipercard">Hipercard</option>
                          <option value="amex">Amex</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Últimos 4 dígitos *</label>
                        <Input value={cardForm.lastFour} onChange={e => setCardForm(f => ({ ...f, lastFour: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="4242" maxLength={4} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1.5">Apelido</label>
                      <Input value={cardForm.nickname} onChange={e => setCardForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Ex: Cartão pessoal" />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={cardForm.isDefault} onChange={e => setCardForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
                      Definir como cartão padrão
                    </label>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveCard} disabled={savingCard} className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl">
                        {savingCard ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button onClick={() => setShowCardForm(false)} variant="outline" className="rounded-xl">Cancelar</Button>
                    </div>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard size={40} className="text-ink-300 mx-auto mb-3" />
                    <p className="text-ink-500 text-sm">Nenhum cartão cadastrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {cards.map(card => (
                      <div key={card.id} className={`relative bg-gradient-to-br ${BRAND_COLORS[card.brand] ?? 'from-ink-600 to-ink-400'} rounded-2xl p-5 text-white`}>
                        {card.isDefault && (
                          <Star size={14} className="absolute top-3 right-3 fill-white text-white" />
                        )}
                        <p className="text-xs font-semibold opacity-80 mb-4">{BRAND_LABELS[card.brand] ?? card.brand}</p>
                        <p className="font-mono text-lg tracking-widest">•••• •••• •••• {card.lastFour}</p>
                        {card.nickname && <p className="text-xs opacity-70 mt-1">{card.nickname}</p>}
                        <button onClick={() => handleDeleteCard(card.id)} className="absolute bottom-3 right-3 opacity-60 hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Verificar que orderService.findMyOrders existe**

Abrir `frontend/src/services/orderService.ts` e confirmar que existe o método `findMyOrders()`. Se não existir, adicionar:

```typescript
async findMyOrders(): Promise<any[]> {
  const { data } = await api.get('/account/orders')
  return Array.isArray(data) ? data : data?.data ?? []
},
```

E adicionar a rota no backend `account.ts` (já no Task 5):
```typescript
// Pedidos do cliente
router.get('/orders', async (req: any, res, next) => {
  try {
    const userId = req.user.id
    const { prisma } = await import('@/prisma/client')
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, total: true, createdAt: true },
    })
    res.json(orders)
  } catch (err) { next(err) }
})
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/account/ContaPage.tsx
git commit -m "feat(conta): rewrite ContaPage with sidebar layout and 5 sections"
```

---

## Task 7: Verificação End-to-End

- [ ] **Step 1: Iniciar backend e frontend**

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

- [ ] **Step 2: Testar fluxo de perfil**

1. Acessar `http://localhost:5173/login` → logar com conta de cliente
2. Redirecionar para `/conta` → sidebar com avatar aparece
3. Clicar "Meus Dados" → preencher nome/telefone → Salvar → toast "Perfil atualizado!"

- [ ] **Step 3: Testar fluxo de senha**

1. Clicar "Alterar Senha" → preencher senha errada → erro "Senha atual incorreta"
2. Preencher senha correta + nova → toast "Senha alterada com sucesso!"

- [ ] **Step 4: Testar endereços**

1. Clicar "Endereços" → lista vazia → botão "Novo endereço"
2. Digitar CEP (ex: 01310-100) → campos preenchem automaticamente via ViaCEP
3. Preencher número → Salvar → endereço aparece na lista com badge "Padrão"
4. Adicionar 2º endereço → ambos aparecem
5. Deletar 1 → some da lista (botão não aparece se só tem 1)

- [ ] **Step 5: Testar cartões**

1. Clicar "Cartões" → lista vazia → "Novo cartão"
2. Selecionar Visa, digitar 4242, apelido "Pessoal" → Salvar
3. Mini-cartão azul aparece com •••• •••• •••• 4242
4. Clicar lixeira → cartão some

- [ ] **Step 6: Verificar build**

```bash
cd frontend && npm run build
cd ../backend && npm run build
```

Esperado: zero erros de TypeScript.

---

## Checklist de Self-Review

- [x] Spec: Sidebar com avatar → Task 6 (ContaPage completo)
- [x] Spec: 5 seções (orders, profile, password, addresses, cards) → Tasks 6
- [x] Spec: updateProfile + updatePassword → Task 2
- [x] Spec: CRUD endereços → Tasks 3 + 5
- [x] Spec: CRUD cartões → Tasks 4 + 5
- [x] Spec: PaymentCard model → Task 1
- [x] Spec: isDefault desmarca os outros → Tasks 3 e 4 (updateMany antes de create)
- [x] Spec: Botão excluir não aparece se único endereço → Task 6 (`addresses.length > 1`)
- [x] Spec: ViaCEP autopreenchimento → Task 6 (`handleCepBlur`)
- [x] Spec: Mini cartão visual por bandeira → Task 6 (`BRAND_COLORS`)
- [x] Spec: Toast feedback sonner → Task 6 (todos os handlers)
- [x] orderService.findMyOrders → Task 6 Step 2 (verificação + rota GET /account/orders)
