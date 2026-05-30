# Frésia Flores — Plano de Migração Next.js

> **Data:** 2026-05-30
> **Branch:** `migration/nextjs-phase1`
> **Base:** `producao` (commit `f1e2601`)

---

## Contexto

O projeto atual usa:
- **Frontend:** React 18 + Vite 5 (SPA)
- **Backend:** Node.js + Express 5 (API REST)
- **Banco:** MySQL 8.0 + Prisma ORM
- **Deploy:** Hostinger (frontend separado + backend separado)

**Problema atual:** Deploy em hospedagem compartilhada gera erros 503 por limitações de runtime (CORS, PORT, PATH aliases, startup crashes).

**Solução:** Migrar para **Next.js** (App Router) para unificar frontend + API em um único app, eliminando problemas de deploy separado.

---

## Objetivos

1. **Zero downtime** durante migração
2. **Reaproveitar 80%+ do código** existente
3. **Manter MySQL + Prisma** (banco não muda)
4. **Deploy simplificado** (1 app, 1 build, 1 start)
5. **Rollback garantido** (branch `producao` intacta)

---

## Estrutura Final Proposta

```
fresia/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout global (fonts, providers)
│   ├── page.tsx                  # Home pública
│   ├── loja/
│   │   ├── page.tsx              # Catálogo
│   │   └── [slug]/
│   │       └── page.tsx          # Produto
│   ├── carrinho/
│   │   └── page.tsx              # Carrinho
│   ├── checkout/
│   │   └── page.tsx              # Checkout multi-step
│   ├── conta/
│   │   ├── layout.tsx            # Layout autenticado
│   │   ├── page.tsx              # Perfil
│   │   └── pedidos/
│   │       └── page.tsx          # Pedidos
│   ├── admin/
│   │   ├── layout.tsx            # Layout admin
│   │   ├── page.tsx              # Dashboard
│   │   ├── produtos/
│   │   ├── pedidos/
│   │   ├── categorias/
│   │   ├── usuarios/
│   │   ├── estoque/
│   │   ├── auditoria/
│   │   ├── cupons/
│   │   ├── promocoes/
│   │   ├── webhooks/
│   │   ├── conteudo/
│   │   └── configuracoes/
│   ├── api/                      # Next.js Route Handlers
│   │   ├── health/
│   │   │   └── route.ts
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── products/
│   │   │   └── route.ts
│   │   ├── categories/
│   │   │   └── route.ts
│   │   ├── orders/
│   │   │   └── route.ts
│   │   ├── payment/
│   │   │   ├── create-preference/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── admin/
│   │   │   ├── products/route.ts
│   │   │   ├── orders/route.ts
│   │   │   ├── categories/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── stats/route.ts
│   │   │   └── ...
│   │   └── ...
│   └── auth/
│       ├── login/page.tsx
│       └── register/page.tsx
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # shadcn primitives (copiar)
│   ├── layout/                   # Header, Footer, Sidebar
│   ├── admin/                    # AdminLayout, DataTable, etc.
│   ├── features/                 # ProductCard, CartSheet, etc.
│   └── checkout/                 # AddressSelector, CardWallet
├── lib/                          # Utilitários
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # Helpers de autenticação
│   ├── mercadopago.ts            # MP client
│   ├── utils.ts                  # Funções utilitárias
│   └── validations.ts            # Zod schemas
├── hooks/                        # Custom hooks
├── store/                        # Zustand stores
├── styles/                       # CSS global + tokens
├── prisma/                       # Schema + migrations + seed
├── public/                       # Assets estáticos
├── next.config.ts                # Configuração Next.js
├── tailwind.config.ts            # Configuração Tailwind
├── tsconfig.json                 # Configuração TypeScript
├── package.json
└── .env.example
```

---

## Fases da Migração

### Fase 1: Setup + Layout (Dia 1-2)
- [ ] Criar projeto Next.js na branch `migration/nextjs-phase1`
- [ ] Configurar Tailwind + shadcn (copiar `components.json` e `tailwind.config.ts`)
- [ ] Migrar `tokens.css` e estilos globais
- [ ] Migrar `Layout`, `Header`, `Footer` para Server Components
- [ ] Configurar Prisma client (`lib/prisma.ts`)
- [ ] Copiar `schema.prisma` + migrations
- [ ] Testar `npm run dev` com layout básico

### Fase 2: Páginas Públicas (Dia 3-5)
- [ ] Migrar `HomePage` (hero, categorias, produtos destaque)
- [ ] Migrar `StorePage` (catálogo com filtros)
- [ ] Migrar `ProductPage` (detalhe + variantes)
- [ ] Migrar `CartPage` (Zustand store)
- [ ] Migrar `CheckoutPage` (multi-step)
- [ ] Migrar páginas estáticas (About, Contact, Blog)
- [ ] Testar fluxo completo: navegar → adicionar → checkout

### Fase 3: Auth + Conta (Dia 6-7)
- [ ] Migrar `LoginPage` e `RegisterPage`
- [ ] Implementar API routes de auth (`/api/auth/*`)
- [ ] Configurar JWT + httpOnly cookies (Server Actions ou Route Handlers)
- [ ] Migrar `ContaPage` (perfil, endereços, cartões)
- [ ] Migrar `OrderDetailPage`
- [ ] Testar fluxo: login → conta → pedidos

### Fase 4: Admin (Dia 8-12)
- [ ] Migrar `AdminLayout` (sidebar, header)
- [ ] Migrar `AdminDashboard` (KPIs, gráficos)
- [ ] Migrar `ProductList` + `ProductForm`
- [ ] Migrar `OrderList` + `OrderDrawer`
- [ ] Migrar `CategoryList`
- [ ] Migrar `UsersPage`
- [ ] Migrar `InventoryPage`
- [ ] Migrar `AuditPage`
- [ ] Migrar `CouponList` + `CouponForm`
- [ ] Migrar `PromotionList` + `PromotionForm`
- [ ] Migrar `WebhooksPage`
- [ ] Migrar `ContentPage` (banners, top bar, popups)
- [ ] Migrar `SettingsPage`
- [ ] Testar CRUD completo de cada módulo

### Fase 5: Pagamentos + Webhooks (Dia 13-14)
- [ ] Migrar Mercado Pago integration (`/api/payment/*`)
- [ ] Migrar webhook handler
- [ ] Testar fluxo completo: checkout → pagamento → notificação
- [ ] Configurar CORS para MP callbacks

### Fase 6: Deploy + Cutover (Dia 15-16)
- [ ] Configurar `next.config.ts` (images, headers, redirects)
- [ ] Testar build (`npm run build`)
- [ ] Deploy em staging (Vercel ou Hostinger Node)
- [ ] Testar todas as funcionalidades em staging
- [ ] Atualizar DNS para apontar para novo app
- [ ] Monitorar logs por 24h
- [ ] Congelar branch `producao` (legado)

---

## Mapeamento de Componentes

### Frontend → Next.js Pages

| Atual (Vite/React) | Novo (Next.js) | Tipo |
|---------------------|----------------|------|
| `HomePage.tsx` | `app/page.tsx` | Server Component |
| `StorePage.tsx` | `app/loja/page.tsx` | Client Component |
| `ProductPage.tsx` | `app/loja/[slug]/page.tsx` | Server Component |
| `CartPage.tsx` | `app/carrinho/page.tsx` | Client Component |
| `CheckoutPage.tsx` | `app/checkout/page.tsx` | Client Component |
| `LoginPage.tsx` | `app/auth/login/page.tsx` | Client Component |
| `RegisterPage.tsx` | `app/auth/register/page.tsx` | Client Component |
| `ContaPage.tsx` | `app/conta/page.tsx` | Client Component |
| `OrderDetailPage.tsx` | `app/conta/pedidos/[id]/page.tsx` | Client Component |
| `AdminDashboard.tsx` | `app/admin/page.tsx` | Client Component |
| `ProductList.tsx` | `app/admin/produtos/page.tsx` | Client Component |
| `ProductForm.tsx` | `app/admin/produtos/novo/page.tsx` | Client Component |
| `OrderList.tsx` | `app/admin/pedidos/page.tsx` | Client Component |
| `CategoryList.tsx` | `app/admin/categorias/page.tsx` | Client Component |
| `UsersPage.tsx` | `app/admin/usuarios/page.tsx` | Client Component |
| `InventoryPage.tsx` | `app/admin/estoque/page.tsx` | Client Component |
| `AuditPage.tsx` | `app/admin/auditoria/page.tsx` | Client Component |
| `CouponList.tsx` | `app/admin/cupons/page.tsx` | Client Component |
| `PromotionList.tsx` | `app/admin/promocoes/page.tsx` | Client Component |
| `WebhooksPage.tsx` | `app/admin/webhooks/page.tsx` | Client Component |
| `ContentPage.tsx` | `app/admin/conteudo/page.tsx` | Client Component |
| `SettingsPage.tsx` | `app/admin/configuracoes/page.tsx` | Client Component |

### Backend Express → Next.js API Routes

| Atual (Express) | Novo (Next.js) | Método |
|-----------------|----------------|--------|
| `GET /api/v1/health` | `GET /api/health` | GET |
| `POST /api/v1/auth/login` | `POST /api/auth/login` | POST |
| `POST /api/v1/auth/register` | `POST /api/auth/register` | POST |
| `POST /api/v1/auth/logout` | `POST /api/auth/logout` | POST |
| `GET /api/v1/auth/me` | `GET /api/auth/me` | GET |
| `GET /api/v1/products` | `GET /api/products` | GET |
| `GET /api/v1/products/:slug` | `GET /api/products/[slug]` | GET |
| `GET /api/v1/categories` | `GET /api/categories` | GET |
| `GET /api/v1/neighborhoods` | `GET /api/neighborhoods` | GET |
| `POST /api/v1/orders` | `POST /api/orders` | POST |
| `POST /api/v1/payment/create-preference` | `POST /api/payment/create-preference` | POST |
| `POST /api/v1/payment/webhook` | `POST /api/payment/webhook` | POST |
| `GET /api/v1/admin/stats` | `GET /api/admin/stats` | GET |
| `CRUD /api/v1/admin/products` | `CRUD /api/admin/products` | ALL |
| `CRUD /api/v1/admin/orders` | `CRUD /api/admin/orders` | ALL |
| ... | ... | ... |

---

## Componentes Reutilizáveis (Copiar Direto)

Estes componentes podem ser copiados **sem alterações**:

- `components/ui/*` (shadcn primitives)
- `components/admin/DataTable.tsx`
- `components/admin/StatCard.tsx`
- `components/admin/Charts.tsx`
- `components/admin/MediaPicker.tsx`
- `components/admin/RichTextEditor.tsx`
- `components/features/ProductCard.tsx`
- `components/features/CategoryCard.tsx`
- `components/features/SearchBar.tsx`
- `components/features/SearchModal.tsx`
- `components/features/CartSheet.tsx`
- `components/features/QuickViewDialog.tsx`
- `components/features/TestimonialCard.tsx`
- `components/features/NewsletterSection.tsx`
- `components/features/GalleryUnified.tsx`
- `components/features/ThumbnailStrip.tsx`
- `components/checkout/AddressSelectorCards.tsx`
- `components/checkout/CardWalletSelector.tsx`
- `components/features/CreditCardForm.tsx`
- `components/features/CreditCardFormFlip.tsx`
- `components/features/PixPayment.tsx`
- `store/cartStore.ts`
- `store/authStore.ts`
- `store/wishlistStore.ts`
- `store/checkoutStore.ts`
- `hooks/useStats.ts`
- `hooks/useWishlist.ts`
- `lib/cardMasks.ts`
- `lib/cookies.ts`
- `lib/utils.ts`

---

## Componentes que Precisam de Adaptação

Estes componentes precisam de ajustes para funcionar com Server Components:

- `components/layout/Header.tsx` → usar `"use client"` se tiver estado
- `components/layout/Footer.tsx` → pode ser Server Component
- `components/layout/Layout.tsx` → migrar para `app/layout.tsx`
- `components/admin/AdminLayout.tsx` → usar `"use client"` se tiver sidebar state
- `components/admin/AdminSidebar.tsx` → usar `"use client"` se tiver estado
- `components/admin/AdminHeader.tsx` → usar `"use client"` se tiver busca
- `components/features/PrivateRoute.tsx` → migrar para middleware ou layout
- `components/features/AdminRoute.tsx` → migrar para middleware ou layout

---

## Variáveis de Ambiente

### Produção (Next.js)

```env
# Database
DATABASE_URL=mysql://u903737197_fresia_test:Fresia%232025%23@srv1894.hstgr.io:3306/u903737197_fresia_test

# Auth
JWT_SECRET=fresia_jwt_2026_super_seguro_trocar_em_producao

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxx
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxx

# App
NEXT_PUBLIC_API_URL=https://fresiaflores.com.br
NODE_ENV=production
```

---

## Checklist de Validação

### Funcionalidades Críticas (Obrigatório)
- [ ] Home carrega com produtos e categorias
- [ ] Catálogo filtra e ordena corretamente
- [ ] Produto exibe variantes e imagens
- [ ] Carrinho persiste entre páginas
- [ ] Checkout calcula frete por bairro
- [ ] Login/Register funcionam
- [ ] Conta exibe perfil e pedidos
- [ ] Admin protegido (apenas isAdmin)
- [ ] Dashboard exibe KPIs corretos
- [ ] CRUD de produtos completo
- [ ] CRUD de pedidos completo
- [ ] Pagamento MP funciona (card + PIX)
- [ ] Webhooks disparam corretamente

### Performance (Objetivo)
- [ ] Lighthouse Performance ≥ 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

### Segurança (Obrigatório)
- [ ] JWT em httpOnly cookies
- [ ] CORS configurado corretamente
- [ ] Rate limiting em auth e payment
- [ ] Uploads validados (MIME + tamanho)
- [ ] SQL injection prevenido (Prisma)
- [ ] XSS prevenido (React escaping)

---

## Rollback

Se algo der errado após cutover:

1. Reverter DNS para apontar para versão legada
2. Congelar branch `migration/nextjs-phase1`
3. Retomar desenvolvimento na branch `producao`
4. Investigar problema sem pressão de tempo

---

## Próximos Passos

1. **Aprovar este plano** (ou ajustar fases)
2. **Executar Fase 1** (setup + layout)
3. **Validar cada fase** antes de avançar
4. **Documentar decisões** em `docs/sessions/`

---

**Versão:** 1.0
**Autor:** Claude Code
**Data:** 2026-05-30
