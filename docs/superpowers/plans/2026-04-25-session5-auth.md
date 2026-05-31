# Sessão 5 — Autenticação (JWT + httpOnly cookies)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar autenticação completa com JWT em cookies httpOnly: registro, login, logout, revalidação de sessão, páginas de Login/Registro com layout split, `authStore` Zustand e proteção de rotas via `<PrivateRoute>`.

**Architecture:** Backend usa bcryptjs para hash de senhas e jsonwebtoken para JWT em cookies httpOnly. O frontend revalida a sessão antes de montar o React (chamando `/auth/me`). `PrivateRoute` redireciona para `/login?redirect=<rota>` se não autenticado.

**Tech Stack:** Express 5, bcryptjs, jsonwebtoken, cookie-parser, React 18, Zustand, React Hook Form, Zod, @hookform/resolvers, shadcn (Input, Button, Checkbox).

---

## Mapa de Arquivos

**Backend:**
| Ação | Arquivo |
|------|---------|
| Criar | `backend/src/services/authService.ts` |
| Criar | `backend/src/controllers/authController.ts` |
| Criar | `backend/src/middlewares/authMiddleware.ts` |
| Criar | `backend/src/routes/auth.ts` |
| Modificar | `backend/src/server.ts` — registrar `/api/v1/auth` |

**Frontend:**
| Ação | Arquivo |
|------|---------|
| Instalar | react-hook-form, zod, @hookform/resolvers, shadcn Checkbox |
| Criar | `frontend/src/store/authStore.ts` |
| Criar | `frontend/src/services/authService.ts` |
| Criar | `frontend/src/components/features/PrivateRoute.tsx` |
| Criar | `frontend/src/pages/auth/LoginPage.tsx` |
| Criar | `frontend/src/pages/auth/RegisterPage.tsx` |
| Criar | `frontend/src/pages/checkout/CheckoutPage.tsx` (placeholder) |
| Criar | `frontend/src/pages/account/ContaPage.tsx` (placeholder) |
| Modificar | `frontend/src/main.tsx` — revalidação no mount |
| Modificar | `frontend/src/App.tsx` — novas rotas |
| Modificar | `frontend/src/components/layout/Header.tsx` — botão conta dinâmico |

---

## Task 1: Backend — authService + authMiddleware + controller + routes

**Files:**
- Create: `fresia-claude-setup/fresia/backend/src/services/authService.ts`
- Create: `fresia-claude-setup/fresia/backend/src/middlewares/authMiddleware.ts`
- Create: `fresia-claude-setup/fresia/backend/src/controllers/authController.ts`
- Create: `fresia-claude-setup/fresia/backend/src/routes/auth.ts`
- Modify: `fresia-claude-setup/fresia/backend/src/server.ts`

- [ ] **Step 1: Criar `backend/src/services/authService.ts`**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  isAdmin: boolean
}

function signToken(userId: number, isAdmin: boolean) {
  return jwt.sign({ id: userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' })
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: false,
    maxAge: COOKIE_MAX_AGE,
  }
}

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ user: AuthUser; token: string }> {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw Object.assign(new Error('Email já está em uso'), { statusCode: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone: phone ?? null },
      select: { id: true, name: true, email: true, phone: true, isAdmin: true },
    })
    return { user, token: signToken(user.id, user.isAdmin) }
  },

  async login(
    email: string,
    password: string
  ): Promise<{ user: AuthUser; token: string }> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 })
    }
    return {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin },
      token: signToken(user.id, user.isAdmin),
    }
  },

  async me(userId: number): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, isAdmin: true },
    })
    if (!user) {
      throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 })
    }
    return user
  },
}
```

- [ ] **Step 2: Criar `backend/src/middlewares/authMiddleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined
  if (!token) return res.status(401).json({ error: 'Não autorizado' })

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; isAdmin: boolean }
    ;(req as any).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Não autorizado' })
  }
}
```

- [ ] **Step 3: Criar `backend/src/controllers/authController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { authService, cookieOptions } from '../services/authService'

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone } = req.body
      const { user, token } = await authService.register(name, email, password, phone)
      res.cookie('token', token, cookieOptions())
      res.status(201).json(user)
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body
      const { user, token } = await authService.login(email, password)
      res.cookie('token', token, cookieOptions())
      res.json(user)
    } catch (err) {
      next(err)
    }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie('token')
    res.json({ message: 'ok' })
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.me((req as any).user.id)
      res.json(user)
    } catch (err) {
      next(err)
    }
  },
}
```

- [ ] **Step 4: Criar `backend/src/routes/auth.ts`**

```typescript
import { Router } from 'express'
import { authController } from '../controllers/authController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', authMiddleware, authController.me)
export default router
```

- [ ] **Step 5: Atualizar `backend/src/server.ts` — adicionar rota auth**

Adicionar após as importações existentes:
```typescript
import authRouter from './routes/auth'
```

Adicionar após as rotas existentes (antes do errorHandler):
```typescript
app.use('/api/v1/auth', authRouter)
```

O arquivo completo fica:
```typescript
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'
import categoriesRouter from './routes/categories'
import productsRouter from './routes/products'
import authRouter from './routes/auth'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() })
})

app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/auth', authRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
```

- [ ] **Step 6: Verificar tipagem backend**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 7: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/src/
git commit -m "feat(backend): auth JWT com registro, login, logout e middleware"
```

---

## Task 2: Backend — Verificar API

- [ ] **Step 1: Reiniciar backend**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsx src/server.ts
```

- [ ] **Step 2: Testar registro**

```bash
curl -s -c cookies.txt -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria Silva","email":"maria@teste.com","password":"senha12345","phone":"11999999999"}'
```

Esperado: `{"id":1,"name":"Maria Silva","email":"maria@teste.com","phone":"11999999999","isAdmin":false}`

- [ ] **Step 3: Testar /me com cookie**

```bash
curl -s -b cookies.txt http://localhost:3001/api/v1/auth/me
```

Esperado: mesmo JSON do registro.

- [ ] **Step 4: Testar login**

```bash
curl -s -c cookies2.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@teste.com","password":"senha12345"}'
```

Esperado: JSON do usuário.

- [ ] **Step 5: Testar erro de credencial inválida**

```bash
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@teste.com","password":"senhaerrada"}'
```

Esperado: `{"error":"Credenciais inválidas"}` com status 401.

- [ ] **Step 6: Limpar arquivo de cookies de teste**

```bash
rm cookies.txt cookies2.txt 2>/dev/null; echo "ok"
```

---

## Task 3: Frontend — Deps + authStore + authService

**Files:**
- Install: react-hook-form, zod, @hookform/resolvers, shadcn Checkbox
- Create: `frontend/src/store/authStore.ts`
- Create: `frontend/src/services/authService.ts`

- [ ] **Step 1: Instalar dependências**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npm install react-hook-form zod @hookform/resolvers
```

Esperado: packages adicionados ao node_modules.

- [ ] **Step 2: Instalar shadcn Checkbox**

```bash
npx shadcn@latest add checkbox --yes
```

Esperado: `src/components/ui/checkbox.tsx` criado.

- [ ] **Step 3: Criar `frontend/src/store/authStore.ts`**

```typescript
import { create } from 'zustand'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  isAdmin: boolean
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}))
```

- [ ] **Step 4: Criar `frontend/src/services/authService.ts`**

```typescript
import { api } from '@/lib/axios'
import type { AuthUser } from '@/store/authStore'

export interface RegisterData {
  name: string
  email: string
  phone?: string
  password: string
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const { data } = await api.post<AuthUser>('/auth/login', { email, password })
    return data
  },

  async register(payload: RegisterData): Promise<AuthUser> {
    const { data } = await api.post<AuthUser>('/auth/register', payload)
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me')
    return data
  },
}
```

- [ ] **Step 5: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros nos novos arquivos.

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/store/authStore.ts frontend/src/services/authService.ts frontend/src/components/ui/checkbox.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): authStore, authService e Checkbox shadcn"
```

---

## Task 4: Frontend — main.tsx + PrivateRoute + placeholders

**Files:**
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/components/features/PrivateRoute.tsx`
- Create: `frontend/src/pages/checkout/CheckoutPage.tsx`
- Create: `frontend/src/pages/account/ContaPage.tsx`

- [ ] **Step 1: Atualizar `frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

async function initAuth() {
  try {
    const user = await authService.me()
    useAuthStore.getState().setUser(user)
  } catch {
    useAuthStore.getState().setUser(null)
  } finally {
    useAuthStore.getState().setLoading(false)
  }
}

initAuth().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
})
```

- [ ] **Step 2: Criar `frontend/src/components/features/PrivateRoute.tsx`**

```tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lilac-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 3: Criar `frontend/src/pages/checkout/CheckoutPage.tsx`**

```tsx
import { Layout } from '@/components/layout/Layout'

export function CheckoutPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-24 text-center">
        <h1 className="font-display italic text-3xl text-ink-800 mb-2">Checkout</h1>
        <p className="text-ink-500 text-sm">Em breve — Sessão 6</p>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 4: Criar `frontend/src/pages/account/ContaPage.tsx`**

```tsx
import { Layout } from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'

export function ContaPage() {
  const { user } = useAuthStore()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-16">
        <h1 className="font-display italic text-3xl text-ink-800 mb-2">Minha Conta</h1>
        <p className="text-ink-500">Bem-vinda, {user?.name}!</p>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 5: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/main.tsx frontend/src/components/features/PrivateRoute.tsx frontend/src/pages/checkout/ frontend/src/pages/account/
git commit -m "feat(frontend): PrivateRoute, revalidacao no mount e placeholders"
```

---

## Task 5: Frontend — LoginPage

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Criar `frontend/src/pages/auth/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await authService.login(data.email, data.password)
      setUser(user)
      const redirect = searchParams.get('redirect')
      navigate(redirect ? decodeURIComponent(redirect) : '/conta', { replace: true })
    } catch {
      setError('Email ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Esquerda — gradiente */}
      <div className="bg-gradient-to-br from-lilac-100 via-petal-100 to-lilac-50 flex flex-col items-center justify-center p-12">
        <div className="relative font-display italic text-5xl text-lilac-500 mb-4">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-petal-400" />
          Frésia
        </div>
        <p className="text-ink-500 text-sm text-center leading-relaxed max-w-[200px]">
          Flores com alma,<br />entregues com carinho.
        </p>
        <div className="text-6xl mt-8">🌸</div>
      </div>

      {/* Direita — formulário */}
      <div className="flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-sm">
          <h1 className="font-display italic text-3xl text-ink-800 mb-1">
            Bem-vinda de volta
          </h1>
          <p className="text-sm text-ink-500 mb-8">Entre na sua conta para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Email
              </label>
              <Input type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Senha
              </label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <button
            type="button"
            className="w-full text-xs text-ink-500 hover:text-ink-800 transition-colors mt-3 text-center"
          >
            Esqueci minha senha
          </button>

          <p className="text-center text-xs text-ink-500 mt-6">
            Não tem conta?{' '}
            <Link to="/registro" className="text-lilac-500 hover:text-lilac-600 font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/pages/auth/LoginPage.tsx
git commit -m "feat(frontend): LoginPage com layout split e validacao Zod"
```

---

## Task 6: Frontend — RegisterPage

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Criar `frontend/src/pages/auth/RegisterPage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

const schema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine(v => v === true, 'Aceite os termos para continuar'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await authService.register({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      })
      setUser(user)
      navigate('/conta', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erro ao criar conta.')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Esquerda — gradiente */}
      <div className="bg-gradient-to-br from-lilac-100 via-petal-100 to-lilac-50 flex flex-col items-center justify-center p-12">
        <div className="relative font-display italic text-5xl text-lilac-500 mb-4">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-petal-400" />
          Frésia
        </div>
        <p className="text-ink-500 text-sm text-center leading-relaxed max-w-[200px]">
          Flores com alma,<br />entregues com carinho.
        </p>
        <div className="text-6xl mt-8">🌸</div>
      </div>

      {/* Direita — formulário */}
      <div className="flex items-center justify-center p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm py-4">
          <h1 className="font-display italic text-3xl text-ink-800 mb-1">Criar sua conta</h1>
          <p className="text-sm text-ink-500 mb-6">Junte-se à comunidade Frésia</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Nome
              </label>
              <Input placeholder="Seu nome completo" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Email
              </label>
              <Input type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Telefone <span className="normal-case font-normal">(opcional)</span>
              </label>
              <Input placeholder="(11) 99999-9999" {...register('phone')} />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Senha
              </label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Confirmar senha
              </label>
              <Input type="password" placeholder="Repita a senha" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                )}
              />
              <label htmlFor="terms" className="text-xs text-ink-500 cursor-pointer leading-relaxed">
                Li e aceito os{' '}
                <span className="text-lilac-500">termos de uso</span> e a{' '}
                <span className="text-lilac-500">política de privacidade</span>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-400 -mt-2">{errors.terms.message}</p>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-4">
            Já tem conta?{' '}
            <Link to="/login" className="text-lilac-500 hover:text-lilac-600 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/pages/auth/RegisterPage.tsx
git commit -m "feat(frontend): RegisterPage com validacao completa e termos"
```

---

## Task 7: Frontend — App.tsx + Header dinâmico

**Files:**
- Modify: `fresia-claude-setup/fresia/frontend/src/App.tsx`
- Modify: `fresia-claude-setup/fresia/frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Substituir `frontend/src/App.tsx` na íntegra**

```tsx
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { StorePage } from '@/pages/store/StorePage'
import { ProductPage } from '@/pages/store/ProductPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { CheckoutPage } from '@/pages/checkout/CheckoutPage'
import { ContaPage } from '@/pages/account/ContaPage'
import { PrivateRoute } from '@/components/features/PrivateRoute'

function HomePage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-24 text-center">
        <h1 className="font-display italic text-5xl text-lilac-500 mb-3">Frésia Flores</h1>
        <p className="text-ink-500 mb-8">Flores com alma, entregues com carinho.</p>
        <a
          href="/loja"
          className="inline-block bg-ink-800 hover:bg-lilac-500 text-white text-sm font-medium px-6 py-3 rounded-pill transition-colors"
        >
          Ver nossa loja
        </a>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/loja" element={<StorePage />} />
      <Route path="/produto/:slug" element={<ProductPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route
        path="/checkout"
        element={
          <PrivateRoute>
            <CheckoutPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/conta"
        element={
          <PrivateRoute>
            <ContaPage />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
```

- [ ] **Step 2: Atualizar botão de conta no `frontend/src/components/layout/Header.tsx`**

Localizar o bloco do botão `<User>` e substituir por:

```tsx
{/* Trocar o botão de User existente por: */}
{!isLoading && user ? (
  <div className="relative group">
    <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
      <User size={18} />
    </button>
    {/* Dropdown */}
    <div className="absolute right-0 top-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg py-1 min-w-[160px] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
      <a
        href="/conta"
        className="block px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800"
      >
        Minha conta
      </a>
      <button
        onClick={async () => {
          await authService.logout()
          setUser(null)
        }}
        className="block w-full text-left px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800"
      >
        Sair
      </button>
    </div>
  </div>
) : !isLoading ? (
  <a
    href="/login"
    className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800"
  >
    <User size={18} />
  </a>
) : (
  <div className="w-10 h-10" />
)}
```

Para isso, adicionar no topo do `Header.tsx`:
```tsx
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
```

E dentro do componente `Header()`:
```tsx
const { user, isLoading, setUser } = useAuthStore()
```

O Header completo atualizado fica:

```tsx
import { useState, useEffect, useRef } from 'react'
import { Search, User, ShoppingBag, ChevronDown } from 'lucide-react'
import { useCartStore, selectCount } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { CartSheet } from '@/components/features/CartSheet'
import { categoryService, type Category } from '@/services/categoryService'
import { productService, type ProductFeatured } from '@/services/productService'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(price))
}

export function Header() {
  const { openCart } = useCartStore()
  const count = useCartStore(selectCount)
  const { user, isLoading, setUser } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<ProductFeatured[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    categoryService.findAll().then(setCategories)
    productService.findFeatured().then(setFeatured)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 bg-ink-50/85 backdrop-blur-md border-b border-ink-200">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-10 max-w-7xl mx-auto px-7 py-4">
          {/* Logo */}
          <a href="/" className="relative flex items-center font-display italic text-2xl text-lilac-500">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-petal-400" />
            Frésia
          </a>

          {/* Nav */}
          <nav className="flex gap-8 justify-center">
            <a href="/" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">Início</a>
            <a href="/loja" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">Loja</a>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 transition-colors py-1"
              >
                Categorias
                <ChevronDown size={14} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-ink-200 rounded-xl shadow-xl p-5 grid grid-cols-[180px_1fr] gap-6 min-w-[540px] z-50">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 mb-3">Categorias</div>
                    <a href="/loja" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors">
                      Todas
                      <span className="text-[11px] text-lilac-500 bg-lilac-50 px-2 rounded-pill">{categories.reduce((a, c) => a + c._count.products, 0)}</span>
                    </a>
                    {categories.map(cat => (
                      <a key={cat.id} href={`/loja?categoria=${cat.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors">
                        {cat.name}
                        <span className="text-[11px] text-lilac-500 bg-lilac-50 px-2 rounded-pill">{cat._count.products}</span>
                      </a>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 mb-3">Destaques</div>
                    <div className="grid grid-cols-3 gap-3">
                      {featured.map(product => (
                        <a key={product.id} href={`/produto/${product.slug}`} onClick={() => setMenuOpen(false)} className="border border-ink-200 rounded-lg overflow-hidden hover:border-lilac-200 hover:shadow-sm transition-all">
                          <div className="bg-gradient-to-br from-lilac-100 to-petal-100 h-16 flex items-center justify-center text-2xl">🌸</div>
                          <div className="p-2">
                            <div className="text-xs font-medium text-ink-800 leading-snug truncate">{product.name}</div>
                            <div className="font-display italic text-sm text-lilac-500">{formatPrice(product.price)}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="/sobre" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">Sobre nós</a>
            <a href="/contato" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">Contato</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
              <Search size={18} />
            </button>

            {/* Botão conta dinâmico */}
            {!isLoading && user ? (
              <div className="relative group">
                <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
                  <User size={18} />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg py-1 min-w-[160px] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                  <a href="/conta" className="block px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800">
                    Minha conta
                  </a>
                  <button
                    onClick={async () => {
                      await authService.logout()
                      setUser(null)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : !isLoading ? (
              <a href="/login" className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
                <User size={18} />
              </a>
            ) : (
              <div className="w-10 h-10" />
            )}

            <button
              onClick={openCart}
              className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800 relative"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-petal-400 text-white text-[10px] font-bold flex items-center justify-center border-2 border-ink-50">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <CartSheet />
    </>
  )
}
```

- [ ] **Step 3: Verificar tipagem completa**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/App.tsx frontend/src/components/layout/Header.tsx
git commit -m "feat(frontend): rotas auth, PrivateRoute e header com conta dinamica"
```

---

## Task 8: Verificação e2e

- [ ] **Step 1: Acessar `/registro`**

Abrir `http://localhost:5173/registro`.
Esperado: layout split — gradiente à esquerda, formulário à direita.

- [ ] **Step 2: Criar conta**

Preencher nome, email, telefone, senha, confirmar senha, marcar termos. Clicar "Criar conta".
Esperado: redireciona para `/conta` com "Bem-vinda, [nome]!". Botão de User no header muda para dropdown.

- [ ] **Step 3: Testar persistência de sessão**

Recarregar página (`F5`).
Esperado: usuário continua logado (cookie persiste).

- [ ] **Step 4: Testar PrivateRoute**

Fazer logout. Acessar `http://localhost:5173/checkout`.
Esperado: redireciona para `/login?redirect=%2Fcheckout`.

- [ ] **Step 5: Testar redirect após login**

Na página de login (com `?redirect=%2Fcheckout`), fazer login com a conta criada.
Esperado: redireciona para `/checkout` (a página placeholder).

- [ ] **Step 6: Testar página de login**

Acessar `/login`, tentar entrar com senha errada.
Esperado: mensagem "Email ou senha incorretos." em vermelho.

- [ ] **Step 7: Commit final**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add -A
git commit -m "chore: verificacao e2e session 5 auth concluida"
```

---

## Self-Review

- [x] **Spec coverage:** backend auth (Task 1), API verify (Task 2), authStore + authService + Checkbox (Task 3), main.tsx + PrivateRoute + placeholders (Task 4), LoginPage (Task 5), RegisterPage (Task 6), App.tsx + Header (Task 7), e2e (Task 8)
- [x] **Sem placeholders:** código completo em todos os steps
- [x] **Consistência:** `AuthUser` interface definida em `authStore.ts` e importada no `authService.ts` frontend. `authService.logout()` chamado no Header com `setUser(null)` após sucesso. `PrivateRoute` usa `isLoading` para evitar flash de redirect antes da revalidação
- [x] **Cookie via proxy:** Vite proxy faz as requests aparecerem como same-origin — cookies são enviados automaticamente sem precisar de `withCredentials`
- [x] **`terms` no Zod:** `z.boolean().refine(v => v === true)` em vez de `z.literal(true)` para compatibilidade com react-hook-form + shadcn Checkbox que usa `boolean`
