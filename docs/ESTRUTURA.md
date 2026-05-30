# Frésia — Estrutura do Projeto

> Documento de referência completo para que qualquer IA ou desenvolvedor entenda a arquitetura, decisões e o estado atual do projeto.
> **Última atualização:** 2026-05-19

---

## 1. Visão Geral

**Frésia** é uma plataforma e-commerce completa para uma boutique de floricultura em **Nova Friburgo, RJ**. O sistema cobre toda a operação: catálogo, carrinho, checkout com pagamento real (Mercado Pago), painel administrativo, blog, gestão de suprimentos e PDV (ponto de venda físico).

**Stack resumida:**
- **Backend:** Node.js + Express 5 + Prisma ORM + MySQL + JWT (httpOnly cookies)
- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS v3 + Zustand + React Router v6
- **Pagamento:** Mercado Pago SDK (mock + real)
- **Animação:** Framer Motion
- **Forms:** React Hook Form + Zod
- **UI:** shadcn/ui (Radix) + lucide-react

---

## 2. Layout de Diretórios

```
fresia-claude-setup/fresia/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Modelo de dados (MySQL)
│   ├── scripts/
│   │   └── seedCatalog.ts         # Seed de produtos do catálogo
│   ├── src/
│   │   ├── controllers/           # Lógica HTTP por recurso
│   │   ├── services/              # Regras de negócio
│   │   ├── routes/                # Definição de rotas Express
│   │   ├── middlewares/           # auth, admin, errorHandler
│   │   ├── lib/                   # Prisma client, helpers
│   │   └── server.ts              # Bootstrap Express
│   ├── public/                    # Arquivos estáticos (uploads)
│   ├── seed-admin.ts              # Cria usuário admin inicial
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── logo-fresia.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui primitives
│   │   │   ├── layout/            # Layout, Header, Footer, GlobalLoader
│   │   │   ├── features/          # ProductCard, QuickViewDialog, PrivateRoute…
│   │   │   ├── account/           # Componentes da área do cliente
│   │   │   ├── admin/             # Componentes do painel admin
│   │   │   └── checkout/          # Steps do checkout
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── store/             # Loja pública (StorePage, ProductPage…)
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── checkout/          # Checkout, OrderConfirmation
│   │   │   ├── account/           # ContaPage, OrderDetailPage
│   │   │   ├── blog/              # BlogPage, BlogPostPage
│   │   │   └── admin/             # Painel administrativo
│   │   ├── services/              # Clientes HTTP (axios)
│   │   ├── store/                 # Zustand stores
│   │   ├── hooks/                 # useRouteLoader, useLoaderEffect…
│   │   ├── schemas/               # Schemas Zod
│   │   ├── lib/                   # cn(), utilitários
│   │   ├── App.tsx                # Rotas + GlobalLoader
│   │   ├── main.tsx               # Boot + initAuth
│   │   └── index.css              # Tailwind + tokens
│   └── package.json
├── docs/
│   ├── ESTRUTURA.md               # ESTE documento
│   ├── APPWRITE_SCHEMA.md         # (legado)
│   ├── MEMORY_SYSTEM.md
│   └── prototypes/
├── docker-compose.yml             # MySQL local
└── CLAUDE.md                      # Instruções de projeto
```

---

## 3. Modelo de Dados (Prisma / MySQL)

**Arquivo:** `backend/prisma/schema.prisma`

### Entidades principais

| Modelo | Função |
|---|---|
| **User** | Cliente ou admin. `isAdmin`, `isSuspended`, `mustChangePassword`, `avatarUrl`. |
| **Address** | Endereços de entrega do usuário. `isDefault` para padrão. |
| **PaymentCard** | Cartões salvos. Inclui `mpToken` e `paymentMethodId` (Mercado Pago). |
| **City / Neighborhood** | Cidades e bairros atendidos. Bairro define `deliveryFee` (taxa fixa). |
| **Category** | Categorias de produto (slug único). |
| **Product** | Produto. `price`/`salePrice` (Decimal — **serializa como string em JSON**), `images` (JSON string), `stock`, `isFeatured`, `allowCoupons`, `categoryId`. |
| **ProductVariant** | Variantes (ex: tamanho do buquê) com preço/estoque/imagens próprios. |
| **Order** | Pedido. `status` (pending/paid/confirmed/shipped/delivered/cancelled), `paymentStatus`, `paymentMethod`, `deliveryMethod`, `channel` (online/pdv). |
| **OrderItem** | Item do pedido com `productId`, `variantId?`, `qty`, `price` (snapshot). |
| **Coupon** | Cupons com `discountType` (percentage/fixed), `validFrom/To`, `maxUses`, `usedCount`. |
| **Promotion** | Promoções de produtos (M2M com Product). |
| **Wishlist** | Lista de desejos `(userId, productId)` única. |
| **Testimonial** | Depoimentos exibidos no site. |
| **NewsletterSubscription** | Inscrição em newsletter. |
| **Setting** | Config key/value (loja, pagamento, frete). |
| **Webhook / WebhookLog** | Webhooks de saída (HMAC) + logs de envio. |
| **Media** | Biblioteca de mídia (uploads). |
| **Post** | Posts do blog. `body` em HTML (TipTap). |
| **Supply / SupplyCategory / SupplyMovement** | Estoque de insumos com movimentações. |

### ⚠️ Pegadinhas conhecidas

- **Prisma `Decimal` serializa como string em JSON.** Sempre fazer `Number(value)` antes de `.toFixed()` ou operações aritméticas no frontend. Já houve bug de tela branca por isso.
- **`Product.images`** é uma **string JSON**, não array. Sempre fazer `typeof product.images === 'string' ? JSON.parse(product.images) : product.images`.
- **`productId` vindo do localStorage** chega como string — usar `Number()` antes de criar `OrderItem` (já tratado em `orderController` e `orderService`).
- **FK constraints** ao deletar produtos: precisa limpar `wishlist`, `orderItems`, `productVariants` e desconectar `promotion-product` antes (vide `seedCatalog.ts`).

---

## 4. Backend — Rotas

**Base URL:** `http://localhost:4000/api/v1`

### Públicas
| Path | Recurso |
|---|---|
| `GET /health` | Healthcheck |
| `GET /categories` | Categorias |
| `GET /products` | Produtos (com filtros: categoria, preço, destaque, promoção, busca) |
| `GET /products/:slug` | Produto por slug |
| `POST /auth/login` `POST /auth/register` `POST /auth/logout` `GET /auth/me` | Autenticação JWT (cookie httpOnly) |
| `GET /cities` `GET /neighborhoods` | Locais atendidos |
| `POST /orders` | Cria pedido (guest ou autenticado) |
| `POST /payment/mp/process` | Processa pagamento Mercado Pago |
| `POST /payment/mp/webhook` | Webhook MP |
| `POST /newsletter` | Inscrição |
| `GET /testimonials` | Depoimentos ativos |
| `GET /settings/public` | Configs públicas (chave MP pública, info da loja) |
| `POST /coupons/validate` | Valida cupom |
| `POST /discounts/calculate` | Calcula descontos automáticos |
| `GET /promotions/active` | Promoções vigentes |
| `GET /posts` `GET /posts/:slug` | Blog público |

### Autenticadas (`/account/*` — exige cookie JWT)
- `GET /account/me` — dados do usuário
- `PATCH /account/me` — atualiza nome/email/telefone
- `PATCH /account/password` — troca senha
- `POST /account/avatar` — upload de avatar
- `GET/POST/PATCH/DELETE /account/addresses[/:id]`
- `GET/POST/PATCH/DELETE /account/cards[/:id]`
- `GET /account/orders` — lista pedidos com items
- `GET /account/orders/:id` — detalhe do pedido
- `POST /account/orders/:id/cancel` — cancela pedido (status pending/paid)
- `GET/POST/DELETE /account/wishlist`

### Admin (`/admin/*` — exige `isAdmin = true`)
- `/admin/products` `/admin/categories` `/admin/orders` `/admin/coupons` `/admin/promotions`
- `/admin/stats` — dashboard (vendas, top produtos, etc.)
- `/admin/users` — gestão de usuários
- `/admin/settings` `/admin/webhooks` `/admin/media` `/admin/posts`
- `/admin/supplies` — estoque de insumos
- `/admin/pdv` — PDV (ponto de venda físico)
- `/admin/cities` `/admin/neighborhoods` `/admin/newsletter`

### Upload
- `POST /upload` — multer (multipart/form-data), salva em `backend/public/uploads/`, retorna `{ url }`.

---

## 5. Frontend — Rotas

**Definidas em** `frontend/src/App.tsx`

### Públicas
| Path | Página |
|---|---|
| `/` | HomePage |
| `/loja` | StorePage (com filtros via querystring: `categoria`, `preco_min`, `preco_max`, `destaque`, `promocao`, `search`) |
| `/produto/:slug` | ProductPage |
| `/sobre` | AboutPage |
| `/contato` | ContactPage |
| `/carrinho` | CartPage |
| `/login` `/registro` | Auth |
| `/checkout` | CheckoutPage |
| `/pedido/:id` | OrderConfirmationPage |
| `/blog` `/blog/:slug` | Blog |

### Cliente autenticado (`<PrivateRoute>`)
| Path | Página |
|---|---|
| `/conta` | ContaPage (5 abas: perfil, endereços, cartões, pedidos, senha) |
| `/pedido/:id/detalhes` | OrderDetailPage (timeline interativa + cancelamento) |

### Admin (`<AdminRoute>`)
- `/admin` — dashboard
- `/admin/produtos` `/admin/produtos/novo` `/admin/produtos/:id`
- `/admin/categorias` `/admin/promocoes[/...]` `/admin/cupons[/...]`
- `/admin/pedidos` `/admin/clientes` `/admin/usuarios`
- `/admin/newsletter` `/admin/depoimentos` `/admin/configuracoes` `/admin/pagamentos`
- `/admin/webhooks` `/admin/fretes` `/admin/estoque` `/admin/auditoria` `/admin/conteudo`
- `/admin/midias` `/admin/blog[/...]` `/admin/suprimentos[/:id]` `/admin/pdv`

---

## 6. Estado Global (Zustand)

**Pasta:** `frontend/src/store/`

| Store | Responsabilidade |
|---|---|
| `authStore.ts` | Usuário logado (`user`, `isLoading`); `setUser`, `logout`, `initAuth`. |
| `cartStore.ts` | Carrinho persistente em localStorage. `items[]`, `addItem`, `removeItem`, `updateQty`, `clear`. |
| `checkoutStore.ts` | Estado do fluxo de checkout entre steps. |
| `wishlistStore.ts` | Wishlist sincronizada com backend para users autenticados. |
| `loaderStore.ts` | **Pre-loader global.** `visible`, `label`, `show(label?)`, `hide()`. |

---

## 7. Sistema de Pre-loader Global

**Implementado em 2026-05.** Substitui flash branco no boot e skeletons inconsistentes.

### Componentes
- **`store/loaderStore.ts`** — Zustand com `visible`, `label`, `show()`, `hide()`.
- **`components/layout/GlobalLoader.tsx`** — Overlay `fixed inset-0` `bg-white/95 backdrop-blur-sm z-[100]`. Logo Frésia animada (scale 1→1.06 em loop) + 3 pontos coloridos orbitando (lilac, petal, leaf) com framer-motion. Label opcional.
- **`hooks/useRouteLoader.ts`** — Chamado em `App.tsx`. Mostra loader por mínimo **400ms** em cada mudança de `location.pathname`. Pula o primeiro render (já coberto pelo boot).
- **`hooks/useLoaderEffect.ts`** — `useLoaderEffect(isLoading, label?)` — sincroniza `isLoading` local de páginas ao loader global.

### Integrações
1. **Boot (`main.tsx`):** `useLoaderStore.getState().show('Carregando…')` antes do `renderApp()`, `initAuth()` roda em background e chama `hide()` no `finally`. React monta imediatamente.
2. **Rotas:** `useRouteLoader()` em `App.tsx`.
3. **Fetch de páginas:** `useLoaderEffect(loading, 'Carregando…')` em `StorePage`, `ProductPage`, `OrderDetailPage`, `ContaPage`.
4. **Submits:** `useLoaderStore.getState().show('Finalizando pedido…')` em `CheckoutPage`, `LoginPage`, cancelamento de pedido.

---

## 8. Fluxos Críticos

### 8.1 Login
1. `LoginPage` → `authService.login(email, password)` → `POST /auth/login` → cookie JWT (httpOnly) gravado.
2. `setUser(user)` no `authStore`. Redireciona para `?redirect=...` ou `/admin` (admin) ou `/conta` (cliente).

### 8.2 Checkout
1. `CartPage` → `/checkout` (CheckoutPage com steps).
2. Coleta: dados do cliente → endereço de entrega → método de entrega (motoboy/retirada/correios) → mensagem de cartão → pagamento.
3. **Pagamento por cartão:** SDK MP tokeniza no frontend → envia `token` + `paymentMethodId` + `installments` para `POST /orders` → backend chama `POST /payment/mp/process`.
4. **PIX/Dinheiro:** apenas cria o pedido em status `pending`.
5. Sucesso: `cartStore.clear()` + redirect para `/pedido/:id` (OrderConfirmationPage).

### 8.3 Cancelamento de pedido
- `OrderDetailPage` mostra timeline interativa (pending → paid → confirmed → shipped → delivered).
- Botão "Solicitar cancelamento" só aparece em `pending` ou `paid`.
- Modal coleta motivo → `POST /account/orders/:id/cancel` → status muda para `cancelled`.

### 8.4 Boot do app
1. `main.tsx` mostra loader sincronamente.
2. React monta imediatamente.
3. `authStore.initAuth()` busca `/auth/me` em background; se cookie válido, popula `user`.
4. Loader esconde no `finally`. Páginas protegidas decidem com base em `authStore.isLoading`.

---

## 9. Convenções de Design

### 9.1 Identidade visual
- **Paleta:** `lilac` (lavanda — primária), `petal` (rosa pétala — destaque), `leaf` (verde — sucesso/secundária), `ink` (cinza escala — texto/bordas). Definida em `index.css` como CSS vars + Tailwind `extend.colors`.
- **Tipografia:** display serif itálica para títulos (logo, hero), sans-serif para corpo.
- **Logo:** texto "Fresia" em itálico + ponto pétala animado.
- **Rounded:** `rounded-pill` para CTAs principais, `rounded-md` para inputs/cards.

### 9.2 Componentes
- **shadcn/ui** como base (`components/ui/`). Toast = sonner.
- Animações suaves: `transition-all duration-200 hover:scale-105 active:scale-95` em CTAs.
- Gradientes lilac→petal em banners.

### 9.3 Padrões de código
- **Comentários:** raros. Só onde "por quê" não é óbvio. Sem JSDoc longos.
- **Tipos no frontend:** importados dos services (`type Product`, `type Order`…).
- **Erros:** `try/catch` com `toast.error()` no frontend; backend usa `errorHandler` middleware.
- **Rotas privadas:** `<PrivateRoute>` (cliente) e `<AdminRoute>` (admin).
- **Forms:** sempre React Hook Form + zodResolver.

---

## 10. Estado Atual (2026-05-19)

### ✅ Implementado e funcionando
- Auth completa (login, registro, troca de senha, recuperação)
- Catálogo público com filtros, busca, paginação ("ver mais")
- Carrinho persistente + checkout multi-step
- Pagamento real com Mercado Pago (Pix + cartão)
- Painel de admin completo (produtos, categorias, pedidos, cupons, promoções, configurações, webhooks, usuários, blog, mídia, suprimentos, PDV, fretes)
- Área do cliente com 5 abas: perfil, endereços, cartões, pedidos, senha
- Detalhe de pedido com timeline interativa + cancelamento
- Wishlist sincronizada com backend
- Newsletter, depoimentos
- Pre-loader global (boot, rotas, fetch, submits)
- 22 produtos do catálogo seed (sem fotos — usuário cadastrará depois)

### 🚧 Estruturas preparadas (integração pendente)
- **Cartões com tokenização real MP** — `mpToken` e `paymentMethodId` no schema, mas tokenização ainda simulada (vide `plans/preciso-acessar-painel-admin-frolicking-melody.md`).
- **PDV** — interface básica criada, expansão de relatórios pendente.
- **Analytics expandido** — dashboard básico ok, métricas avançadas pendentes.

### ❌ Não implementado / legado
- **Appwrite** — removido em favor de backend próprio. Restos em `services/appwrite/`.
- **LightRAG** — sistema de memória externo, ver `memory/project_lightrag_pending.md`.

---

## 11. Comandos Úteis

```bash
# Backend
cd backend
npm run dev              # tsx watch src/server.ts (porta 4000)
npm run seed             # seed inicial
npx prisma generate      # após mudar schema
npx prisma migrate dev   # nova migration
npx tsx scripts/seedCatalog.ts  # recadastra 22 produtos

# Frontend
cd frontend
npm run dev              # vite (porta 5173)
npm run build            # tsc + vite build

# MySQL local
docker compose up -d mysql
```

### Variáveis de ambiente (`backend/.env`)
```
DATABASE_URL="mysql://root:password@localhost:3306/fresia"
JWT_SECRET="..."
MP_ACCESS_TOKEN="..."
MP_PUBLIC_KEY="..."
NODE_ENV="development"
```

---

## 12. Pontos de Atenção para IA

Ao tocar neste projeto, lembre-se:

1. **Decimal do Prisma vira string em JSON.** Sempre `Number()` antes de operações.
2. **`Product.images` é string JSON**, não array. Sempre `JSON.parse` se for string.
3. **`productId` em `OrderItem`** precisa ser `Number()` se vier de localStorage.
4. **Windows + Prisma**: parar processos Node antes de `npx prisma generate` (lock no .dll).
5. **Sem `--no-verify`** em commits. Resolver hooks ao invés de pulá-los.
6. **Pre-loader global existe** — use `useLoaderEffect` / `useLoaderStore.show()` ao invés de criar skeletons novos.
7. **Categorias e bairros** já têm dados em produção — não dropar tabela, reusar.
8. **Pedidos têm FK em produto** — não deletar produto sem antes limpar `orderItems`.
9. **Cookies httpOnly** — `axios` em `services/*.ts` precisa de `withCredentials: true`.
10. **Idioma da UI:** todo texto visível ao usuário em **português brasileiro**. Mensagens curtas e acolhedoras ("Bem-vinda de volta", "Flores com alma").

---

**Fim do documento.** Para detalhes de um módulo específico, ler o código direto — a estrutura é consistente o suficiente para que o nome do arquivo indique a responsabilidade.
