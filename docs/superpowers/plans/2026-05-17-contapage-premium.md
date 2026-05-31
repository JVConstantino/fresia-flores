# ContaPage Premium — Sidebar Rica + Grade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the customer account panel into a premium experience with a rich sidebar (avatar, stats, member badge), grid-based content layout, and reusable components for avatar upload, address cards, and payment card wallet.

**Architecture:** The ContaPage is refactored from a 2-column flat layout into a `grid-cols-[300px_1fr]` structure. The sidebar is a single component (`SidebarUserCard`) that displays user profile, stats, and navigation. Content areas use grid layouts (2-column for addresses) and shared components (`AddressCardGrid`, `CardWallet`, `OrderExpandable`). Avatar upload is handled via a new backend endpoint `/account/profile/avatar`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Zustand (auth store), Axios (API calls), Lucide React (icons), Sonner (toasts), Framer Motion optional (animations).

---

## File Structure

### Backend
- Modify: `backend/prisma/schema.prisma` — add `avatarUrl` field to User
- Create: `backend/src/controllers/avatarController.ts` — handle avatar upload
- Modify: `backend/src/routes/account.ts` — register avatar upload route
- Modify: `backend/src/middlewares/` — ensure multipart handling for upload

### Frontend
- **Modify (main):**
  - `frontend/src/pages/account/ContaPage.tsx` — refactor layout to 2-column grid, restructure tabs
  
- **Create (reusable components):**
  - `frontend/src/components/account/SidebarUserCard.tsx` — user profile + stats + nav
  - `frontend/src/components/account/AddressCardGrid.tsx` — grid of address cards
  - `frontend/src/components/account/CardWallet.tsx` — payment card with flip animation
  - `frontend/src/components/account/OrderExpandable.tsx` — order item with expand/collapse
  - `frontend/src/components/account/TabContent.tsx` — wrapper for tab content areas
  
- **Update (shared):**
  - `frontend/src/store/authStore.ts` — add `setUserAvatar(url)` method

---

## Task 1: Backend Schema — Add Avatar Field

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/[timestamp]_add_user_avatar/migration.sql`

- [ ] **Step 1: Read the User model in schema.prisma**

Run: Check current User model structure
```bash
grep -A 20 "model User" backend/prisma/schema.prisma
```

- [ ] **Step 2: Add avatarUrl field to User model**

**Modify** `backend/prisma/schema.prisma` — find the User model and add:
```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  passwordHash    String
  name            String
  phone           String?
  isAdmin         Boolean  @default(false)
  avatarUrl       String?  // ← NEW: Store user's avatar URL
  createdAt       DateTime @default(now())
  
  // ... rest of relations remain the same
  addresses       Address[]
  orders          Order[]
  paymentCards    PaymentCard[]
  wishlists       Wishlist[]
}
```

- [ ] **Step 3: Create and run migration**

Run:
```bash
cd backend
npx prisma migrate dev --name add_user_avatar
```

Expected: Migration creates `avatarUrl` column (nullable string) in users table.

- [ ] **Step 4: Regenerate Prisma client**

Run:
```bash
cd backend
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
cd backend
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(schema): add avatarUrl field to User model"
```

---

## Task 2: Backend — Avatar Upload Endpoint

**Files:**
- Create: `backend/src/controllers/avatarController.ts`
- Modify: `backend/src/routes/account.ts`
- Modify: `backend/src/server.ts` (ensure multer configured)

- [ ] **Step 1: Check multer configuration in server.ts**

Run:
```bash
grep -n "multer\|upload" backend/src/server.ts | head -20
```

Verify that multer is set up for file uploads. If not already configured, add:
```typescript
import multer from 'multer'
const upload = multer({ dest: 'public/uploads/' })
```

- [ ] **Step 2: Create avatarController.ts**

**Create** `backend/src/controllers/avatarController.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'
import fs from 'fs'
import path from 'path'

export const avatarController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const file = req.file

      if (!file) {
        return res.status(400).json({ error: 'Arquivo não fornecido' })
      }

      // Validate file is an image
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedMimes.includes(file.mimetype)) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ error: 'Apenas imagens (JPEG, PNG, WebP) são permitidas' })
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ error: 'Arquivo muito grande (máx 5MB)' })
      }

      // Get current user to delete old avatar if exists
      const currentUser = await prisma.user.findUnique({ where: { id: userId } })
      if (currentUser?.avatarUrl) {
        const oldPath = path.join(process.cwd(), 'public', currentUser.avatarUrl.replace('/public/', ''))
        try {
          fs.unlinkSync(oldPath)
        } catch (err) {
          // Ignore if file doesn't exist
        }
      }

      // Generate filename: userId_timestamp_originalname
      const filename = `${userId}_${Date.now()}_${file.originalname}`
      const relativePath = `/uploads/${filename}`

      // Rename temp file to final location
      const finalPath = path.join(process.cwd(), 'public', 'uploads', filename)
      fs.renameSync(file.path, finalPath)

      // Update user in database
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: relativePath },
        select: { id: true, name: true, email: true, avatarUrl: true, phone: true, isAdmin: true }
      })

      res.json(user)
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 3: Add avatar route to account.ts**

**Modify** `backend/src/routes/account.ts` — add at the top after imports:
```typescript
import multer from 'multer'
import { avatarController } from '@/controllers/avatarController'

const upload = multer({ dest: 'public/uploads/' })
```

Then add this route after the existing profile routes:
```typescript
// Avatar upload
router.post('/profile/avatar', upload.single('avatar'), avatarController.upload)
```

- [ ] **Step 4: Verify multipart handling**

Check that the Express app has multipart support. In `backend/src/server.ts`, ensure:
```typescript
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
```

(This is likely already there.)

- [ ] **Step 5: Create uploads directory if it doesn't exist**

Run:
```bash
mkdir -p backend/public/uploads
```

Add to `.gitignore`:
```
backend/public/uploads/*
!backend/public/uploads/.gitkeep
```

Create a `.gitkeep`:
```bash
touch backend/public/uploads/.gitkeep
```

- [ ] **Step 6: Test the endpoint manually**

Start the backend:
```bash
cd backend && npm run dev
```

In another terminal, test avatar upload:
```bash
curl -X POST http://localhost:4000/api/v1/account/profile/avatar \
  -H "Cookie: token=<YOUR_JWT_TOKEN>" \
  -F "avatar=@/path/to/test.jpg"
```

Expected: Returns updated user object with `avatarUrl` field.

- [ ] **Step 7: Commit**

```bash
cd backend
git add src/controllers/avatarController.ts src/routes/account.ts .gitignore public/uploads/.gitkeep
git commit -m "feat(backend): add avatar upload endpoint"
```

---

## Task 3: Frontend — Update AuthStore with Avatar Method

**Files:**
- Modify: `frontend/src/store/authStore.ts`

- [ ] **Step 1: Read authStore.ts**

Run:
```bash
cat frontend/src/store/authStore.ts
```

- [ ] **Step 2: Add setUserAvatar method**

**Modify** `frontend/src/store/authStore.ts`:
```typescript
import { create } from 'zustand'

export interface AuthUser {
  id: string | number
  name: string
  email: string
  phone: string | null
  isAdmin: boolean
  avatarUrl?: string | null  // ← ADD THIS
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
  setUserAvatar: (avatarUrl: string | null) => void  // ← ADD THIS
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
  setUserAvatar: (avatarUrl) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatarUrl } : null
    }))
}))
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/store/authStore.ts
git commit -m "feat(store): add setUserAvatar to authStore"
```

---

## Task 4: Frontend — Create Sidebar Component (SidebarUserCard)

**Files:**
- Create: `frontend/src/components/account/SidebarUserCard.tsx`

- [ ] **Step 1: Create the component file**

**Create** `frontend/src/components/account/SidebarUserCard.tsx`:
```typescript
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { User, LogOut, Upload } from 'lucide-react'

interface Stats {
  orderCount: number
  totalSpent: number
  addressCount: number
  cardCount: number
}

interface SidebarUserCardProps {
  stats: Stats
  onLogout: () => void
}

export function SidebarUserCard({ stats, onLogout }: SidebarUserCardProps) {
  const { user, setUserAvatar } = useAuthStore()
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
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const memberSinceDate = user
    ? new Date(user.createdAt || new Date()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Novo cliente'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-b from-lilac-100 to-transparent">
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-32 h-32 rounded-full bg-lilac-500 flex items-center justify-center text-white overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-4xl font-bold">{getInitials(user?.name || '')}</div>
          )}
        </div>
        <label className="absolute bottom-0 right-0 bg-petal-400 rounded-full p-2 cursor-pointer hover:bg-petal-300 transition-colors">
          <Upload size={16} className="text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploading && <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center"><div className="spinner" /></div>}
      </div>

      {/* User Info */}
      <h2 className="text-xl font-bold text-ink-800">{user?.name}</h2>
      <p className="text-sm text-ink-500 mb-2">{user?.email}</p>
      <p className="text-xs text-ink-400 mb-6">Cliente desde {memberSinceDate}</p>

      {/* Stats */}
      <div className="w-full space-y-3 mb-6 pb-6 border-b border-ink-200">
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Pedidos</span>
          <span className="font-bold text-lilac-600">{stats.orderCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Total gasto</span>
          <span className="font-bold text-lilac-600">R$ {stats.totalSpent.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Endereços</span>
          <span className="font-bold text-lilac-600">{stats.addressCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Cartões</span>
          <span className="font-bold text-lilac-600">{stats.cardCount}</span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-800 rounded-lg transition-colors"
      >
        <LogOut size={16} />
        Sair
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/account/SidebarUserCard.tsx
git commit -m "feat(component): create SidebarUserCard with avatar upload"
```

---

## Task 5: Frontend — Create Address Card Grid Component

**Files:**
- Create: `frontend/src/components/account/AddressCardGrid.tsx`

- [ ] **Step 1: Create the component**

**Create** `frontend/src/components/account/AddressCardGrid.tsx`:
```typescript
import { MapPin, Trash2, Edit2 } from 'lucide-react'

export interface AddressCardProps {
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

interface AddressCardGridProps {
  addresses: AddressCardProps[]
  isLoading: boolean
  onEdit: (address: AddressCardProps) => void
  onDelete: (id: number) => void
  onAddNew: () => void
}

export function AddressCardGrid({
  addresses,
  isLoading,
  onEdit,
  onDelete,
  onAddNew
}: AddressCardGridProps) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando endereços...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Meus Endereços</h3>
        <button
          onClick={onAddNew}
          className="px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg text-sm transition-colors"
        >
          ＋ Novo Endereço
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-ink-400">
          <MapPin className="mx-auto mb-2 opacity-50" />
          <p>Nenhum endereço cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 border border-ink-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {addr.isDefault && (
                <div className="mb-2 inline-block px-2 py-1 bg-lilac-100 text-lilac-700 text-xs font-semibold rounded">
                  Padrão
                </div>
              )}
              <p className="font-semibold text-ink-800">
                {addr.street}, {addr.number}
              </p>
              {addr.complement && <p className="text-sm text-ink-600">{addr.complement}</p>}
              <p className="text-sm text-ink-600">
                {addr.neighborhood}, {addr.city} - {addr.state}
              </p>
              <p className="text-sm text-ink-500">{addr.zipCode}</p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onEdit(addr)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded text-sm transition-colors"
                >
                  <Edit2 size={14} />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(addr.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/account/AddressCardGrid.tsx
git commit -m "feat(component): create AddressCardGrid for address display"
```

---

## Task 6: Frontend — Create Card Wallet Component (Flip Animation)

**Files:**
- Create: `frontend/src/components/account/CardWallet.tsx`

- [ ] **Step 1: Create the flip card component**

**Create** `frontend/src/components/account/CardWallet.tsx`:
```typescript
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export interface CardWalletProps {
  id: number
  brand: string
  lastFour: string
  nickname?: string | null
  isDefault: boolean
  onDelete: (id: number) => void
}

const BRAND_COLORS: Record<string, string> = {
  visa: 'from-blue-700 to-blue-500',
  mastercard: 'from-red-700 to-orange-500',
  elo: 'from-yellow-600 to-yellow-400',
  hipercard: 'from-red-800 to-red-600',
  amex: 'from-green-700 to-green-500'
}

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  hipercard: 'Hipercard',
  amex: 'American Express'
}

export function CardWallet({ id, brand, lastFour, nickname, isDefault, onDelete }: CardWalletProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const colorClass = BRAND_COLORS[brand.toLowerCase()] || 'from-gray-700 to-gray-500'
  const brandLabel = BRAND_LABELS[brand.toLowerCase()] || brand

  return (
    <div
      className={`relative w-full h-48 cursor-pointer transition-transform duration-500 [perspective:1000px]`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Frente do cartão */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg [backface-visibility:hidden] flex flex-col justify-between`}
        >
          <div>
            {isDefault && (
              <div className="mb-2 inline-block px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded">
                Padrão
              </div>
            )}
            <p className="text-sm opacity-80">Número do cartão</p>
            <p className="text-2xl font-mono tracking-widest mt-1">•••• •••• •••• {lastFour}</p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80">Nome do titular</p>
              <p className="font-semibold text-sm">{nickname || brandLabel}</p>
            </div>
            <div className="text-lg font-bold">{brandLabel}</div>
          </div>
        </div>

        {/* Verso do cartão */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center items-center`}
        >
          <p className="text-xs opacity-80 mb-2">CVV</p>
          <p className="text-3xl font-mono tracking-widest">•••</p>
          <p className="text-xs opacity-80 mt-4">Últimos 4 dígitos</p>
          <p className="text-2xl font-mono tracking-widest">{lastFour}</p>
        </div>
      </div>

      {/* Botão deletar (overlay) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg z-10 transition-colors"
        title="Deletar cartão"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/account/CardWallet.tsx
git commit -m "feat(component): create CardWallet with flip animation"
```

---

## Task 7: Frontend — Create Order Expandable Component

**Files:**
- Create: `frontend/src/components/account/OrderExpandable.tsx`

- [ ] **Step 1: Create the component**

**Create** `frontend/src/components/account/OrderExpandable.tsx`:
```typescript
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface OrderItem {
  id?: number
  productId: number
  productName?: string
  variantId?: number | null
  variantName?: string | null
  qty: number
  price: number
}

export interface OrderExpandableProps {
  id: number
  status: string
  total: number
  createdAt: string
  items?: OrderItem[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

export function OrderExpandable({
  id,
  status,
  total,
  createdAt,
  items = []
}: OrderExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusLabel = STATUS_LABELS[status] || status
  const statusColor = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
  const date = new Date(createdAt).toLocaleDateString('pt-BR')

  return (
    <div className="border border-ink-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-ink-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          <div>
            <p className="font-semibold text-ink-800">Pedido #{id}</p>
            <p className="text-sm text-ink-500">{date}</p>
          </div>
          <div className={`px-3 py-1 rounded text-sm font-semibold ${statusColor}`}>
            {statusLabel}
          </div>
        </div>
        <div className="text-right mr-4">
          <p className="font-bold text-ink-800">R$ {total.toFixed(2)}</p>
        </div>
        <ChevronDown
          size={20}
          className={`text-ink-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable content */}
      {isExpanded && items.length > 0 && (
        <div className="bg-ink-50 px-4 py-4 border-t border-ink-200 space-y-2">
          <p className="text-sm font-semibold text-ink-700 mb-3">Itens do pedido:</p>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-ink-700">
                {item.productName || `Produto #${item.productId}`}
                {item.variantName && ` - ${item.variantName}`}
                <span className="text-ink-500 ml-1">x{item.qty}</span>
              </span>
              <span className="font-semibold text-ink-800">R$ {(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/account/OrderExpandable.tsx
git commit -m "feat(component): create OrderExpandable for order display"
```

---

## Task 8: Frontend — Refactor ContaPage Layout

**Files:**
- Modify: `frontend/src/pages/account/ContaPage.tsx` (major refactor)

- [ ] **Step 1: Read current ContaPage.tsx to understand state**

Run:
```bash
head -100 frontend/src/pages/account/ContaPage.tsx
```

- [ ] **Step 2: Refactor ContaPage with new layout**

**Replace** `frontend/src/pages/account/ContaPage.tsx` with the refactored version:

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Package, User, Lock, MapPin, CreditCard } from 'lucide-react'

import { SidebarUserCard } from '@/components/account/SidebarUserCard'
import { AddressCardGrid } from '@/components/account/AddressCardGrid'
import { CardWallet } from '@/components/account/CardWallet'
import { OrderExpandable, type OrderExpandableProps } from '@/components/account/OrderExpandable'

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

  // Cards state
  const [cards, setCards] = useState<PaymentCard[]>([])

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
      }
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
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

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Calculate stats
  const stats = {
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
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
                      <Input
                        value={addressForm.neighborhood}
                        onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                        placeholder="Bairro..."
                      />
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
                <h3 className="text-lg font-semibold mb-4">Meus Cartões</h3>
                {cards.length === 0 ? (
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
```

- [ ] **Step 3: Verify imports are available**

Check that all imported components exist:
```bash
ls -la frontend/src/components/account/
```

If any are missing, they were created in earlier tasks.

- [ ] **Step 4: Test the refactored page in browser**

Start dev servers and navigate to `/conta`. Verify:
- Sidebar displays avatar, name, email, badge, stats
- Tab navigation works (active state changes)
- Each tab renders its content
- Address form expands/collapses correctly
- Cards display in grid (empty if no cards)

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/pages/account/ContaPage.tsx
git commit -m "feat(ContaPage): refactor to premium layout with sidebar and grid"
```

---

## Task 9: Styling — Add Avatar Upload Spinner (Optional)

**Files:**
- Modify: `frontend/src/index.css` (or global styles)

- [ ] **Step 1: Add spinner animation**

If using Tailwind, add to global CSS or component-level:
```css
@keyframes spin-custom {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin-custom 1s linear infinite;
}
```

Or use Tailwind's built-in `animate-spin`:
```tsx
// In SidebarUserCard, replace spinner div with:
{uploading && <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center"><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /></div>}
```

- [ ] **Step 2: Commit (if CSS changed)**

```bash
cd frontend
git add src/index.css  # if you added CSS
git commit -m "style: add spinner animation for avatar upload"
```

---

## Task 10: Testing & Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Start dev servers**

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

- [ ] **Step 2: Test avatar upload**

1. Navigate to `/conta`
2. Click the camera icon on the avatar
3. Select an image file
4. Verify:
   - Spinner appears during upload
   - Avatar image displays after upload
   - Toast shows "Avatar atualizado com sucesso"
   - Sidebar sidebar shows the new avatar

- [ ] **Step 3: Test sidebar stats**

1. Verify stats display correctly:
   - Pedidos count = actual orders count
   - Total gasto = sum of order totals
   - Endereços count = actual address count
   - Cartões count = actual card count

- [ ] **Step 4: Test address grid layout**

1. Click "Endereços" tab
2. Verify:
   - Addresses display in 2-column grid on desktop
   - Each card shows street, number, neighborhood, city, state, zipCode
   - "Padrão" badge shows on default address
   - Edit and Delete buttons work
   - "＋ Novo Endereço" button opens form
   - Form can be filled and saved
   - New address appears in grid

- [ ] **Step 5: Test card wallet flip**

1. Click "Cartões" tab (add test card first via API or UI if available)
2. Hover over a card:
   - Card flips to show CVV side
   - Move mouse away: card flips back
3. Click card: toggle flip state
4. Delete button works

- [ ] **Step 6: Test tab navigation**

1. Click each tab and verify content loads correctly
2. Verify active tab styling changes
3. Verify data persists when switching tabs (navigate away and back)

- [ ] **Step 7: Test responsive design**

1. Open DevTools (F12)
2. Set viewport to mobile (375px width)
3. Verify:
   - Sidebar stays 300px (or adjust for mobile if needed)
   - Address grid becomes 1 column
   - Card grid becomes 1 column (or adjust)
   - All text is readable

- [ ] **Step 8: Test logout**

1. Click "Sair" button in sidebar
2. Verify:
   - User is redirected to `/login`
   - User session is cleared

- [ ] **Step 9: Run build to check for errors**

```bash
cd frontend
npm run build
```

Expected: No TypeScript errors, build succeeds.

- [ ] **Step 10: Commit final state**

```bash
cd frontend
git add -A
git commit -m "test: verify ContaPage premium layout works end-to-end"
```

---

## Summary

**Subsistema 1 (ContaPage Premium) é agora completo!**

### O que foi implementado:

✅ **Backend:**
- Schema: campo `avatarUrl` no User
- Endpoint: `POST /account/profile/avatar` para upload

✅ **Frontend Components:**
- `SidebarUserCard` — sidebar com avatar, stats, navegação
- `AddressCardGrid` — grid de endereços em cards
- `CardWallet` — cartão com flip animation 3D
- `OrderExpandable` — pedido com expand/collapse

✅ **Frontend Page:**
- `ContaPage.tsx` refatorado com layout `grid-cols-[300px_1fr]`
- 5 tabs funcionais: Pedidos, Perfil, Senha, Endereços, Cartões
- Integração completa com API

✅ **Features:**
- Avatar upload com spinner
- Stats calculados corretamente
- Address CRUD com ViaCEP (já existente, apenas melhorado)
- Card flip animation ao hover
- Responsive design (2-col endereços, 1-col mobile)
- Logout funcional

### Próximos passos:

1. **Subsistema 2** (Cartões com MP real) — depende desta base
2. **Subsistema 3** (Checkout inteligente) — usa ContaPage + Cartões MP
3. Subsistemas 4, 5, 6 — independentes, podem ser paralelos

**Pronto para avançar?**
