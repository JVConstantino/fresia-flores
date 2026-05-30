# Design: Sessão 5 — Autenticação (JWT + httpOnly cookies)

**Data:** 2026-04-25
**Status:** Aprovado

---

## Objetivo

Implementar autenticação completa: backend JWT com bcrypt e cookies httpOnly, páginas de Login e Registro (layout split premium), `authStore` Zustand com revalidação no mount, e `<PrivateRoute>` para proteger `/checkout` e `/conta/*`.

---

## Decisões

| Decisão | Escolha |
|---------|---------|
| Layout auth pages | Opção B: split gradiente lilac/petal + formulário |
| Campos de registro | Nome, Email, Telefone, Senha, Confirmar senha, Aceitar termos |
| Armazenamento JWT | Cookie httpOnly, sameSite lax, secure false em dev |
| Expiração JWT | 7 dias |
| Hash de senha | bcryptjs, rounds=12 |
| authStore persist | Não — revalidado via GET /auth/me no mount |
| Validação forms | React Hook Form + Zod |

---

## Backend

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `backend/src/services/authService.ts` |
| Criar | `backend/src/controllers/authController.ts` |
| Criar | `backend/src/routes/auth.ts` |
| Criar | `backend/src/middlewares/authMiddleware.ts` |
| Modificar | `backend/src/server.ts` — registrar `/api/v1/auth` |

### Rotas

```
POST /api/v1/auth/register
  body: { name, email, phone?, password }
  → cria User com bcrypt hash
  → assina JWT, seta cookie httpOnly
  → retorna { id, name, email, phone, isAdmin }

POST /api/v1/auth/login
  body: { email, password }
  → bcrypt.compare
  → assina JWT, seta cookie httpOnly
  → retorna { id, name, email, phone, isAdmin }

POST /api/v1/auth/logout
  → limpa cookie (maxAge: 0)
  → retorna { message: 'ok' }

GET /api/v1/auth/me  [requer authMiddleware]
  → retorna { id, name, email, phone, isAdmin }
```

### Cookie config

```typescript
res.cookie('token', jwt, {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,      // true em produção
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 dias em ms
})
```

### authMiddleware

```typescript
// Lê req.cookies.token
// jwt.verify(token, JWT_SECRET)
// Se válido: req.user = { id, isAdmin }; next()
// Se inválido: res.status(401).json({ error: 'Não autorizado' })
```

### Erros tratados

| Situação | Status | Mensagem |
|---------|--------|---------|
| Email já cadastrado | 409 | "Email já está em uso" |
| Email não encontrado | 401 | "Credenciais inválidas" |
| Senha incorreta | 401 | "Credenciais inválidas" |
| Token ausente/inválido | 401 | "Não autorizado" |

---

## Frontend

### Arquivos

| Ação | Arquivo |
|------|---------|
| Instalar | `shadcn Checkbox` |
| Criar | `frontend/src/store/authStore.ts` |
| Criar | `frontend/src/services/authService.ts` |
| Criar | `frontend/src/components/features/PrivateRoute.tsx` |
| Criar | `frontend/src/pages/auth/LoginPage.tsx` |
| Criar | `frontend/src/pages/auth/RegisterPage.tsx` |
| Modificar | `frontend/src/App.tsx` — rotas /login, /registro, PrivateRoute |
| Modificar | `frontend/src/components/layout/Header.tsx` — botão conta dinâmico |
| Modificar | `frontend/src/main.tsx` — chamar GET /auth/me no mount |

### authStore.ts

```typescript
interface AuthUser {
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
  isLoading: true,   // começa true — aguarda revalidação
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}))
```

### authService.ts (frontend)

```typescript
// login(email, password) → POST /auth/login → AuthUser
// register(data) → POST /auth/register → AuthUser
// logout() → POST /auth/logout
// me() → GET /auth/me → AuthUser  (lança se 401)
```

### Revalidação no mount (main.tsx)

```tsx
// Antes de renderizar o App, chamar authService.me()
// Se sucesso: useAuthStore.getState().setUser(user)
// Se erro (401): useAuthStore.getState().setUser(null)
// Em ambos: setLoading(false)
```

### PrivateRoute.tsx

```tsx
// const { user, isLoading } = useAuthStore()
// const location = useLocation()
// if (isLoading) → <div>carregando...</div>
// if (!user) → <Navigate to={`/login?redirect=${location.pathname}`} replace />
// return <>{children}</>
```

### LoginPage.tsx (`/login`)

Layout split:
```
Esquerda: gradiente lilac→petal, "Frésia" Fraunces italic, tagline
Direita:
  "Bem-vinda de volta" (h2)
  "Entre na sua conta para continuar" (subtitle)
  Form (React Hook Form + Zod):
    Email (required, email válido)
    Senha (required, min 6 chars)
  Button "Entrar" full-width pill ink-800
  Link "Esqueci minha senha" (placeholder, sem ação)
  "Não tem conta? Criar conta" → /registro
```

Após login bem-sucedido:
- `authStore.setUser(user)`
- Redirecionar para `searchParams.get('redirect') ?? '/conta'`

### RegisterPage.tsx (`/registro`)

Layout split (mesmo padrão):
```
Esquerda: igual ao Login
Direita:
  "Criar sua conta" (h2)
  Form (React Hook Form + Zod):
    Nome (required, min 2 chars)
    Email (required, email válido)
    Telefone (optional)
    Senha (required, min 8 chars)
    Confirmar senha (must match)
    Checkbox "Li e aceito os termos de uso" (required)
  Button "Criar conta" full-width pill ink-800
  "Já tem conta? Entrar" → /login
```

Após registro bem-sucedido:
- `authStore.setUser(user)`
- Redirecionar para `/conta`

### Header — botão conta dinâmico

```tsx
// if isLoading → nada (evita flash)
// if user → botão com nome + dropdown: "Minha conta" (/conta) | "Sair" (logout + setUser(null))
// if !user → link "Entrar" → /login
```

### App.tsx — novas rotas

```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/registro" element={<RegisterPage />} />
<Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
// /conta/* — Sessão 6
```

> **Nota:** `CheckoutPage` é um placeholder vazio por enquanto — a rota existe mas a página ainda não.

---

## Critérios de Sucesso

1. `POST /auth/register` cria usuário e seta cookie
2. `POST /auth/login` valida e seta cookie
3. `GET /auth/me` com cookie válido retorna usuário
4. Recarregar página com cookie ativo → usuário permanece logado
5. `/login` com redirect → após login vai para a rota original
6. `/checkout` sem login → redireciona para `/login?redirect=/checkout`
7. Botão "Sair" limpa cookie + store

---

## Fora do Escopo

- Reset de senha (pós-MVP)
- OAuth (pós-MVP)
- Página `/conta` com pedidos (Sessão 6)
- CheckoutPage real (Sessão 6)
