# Frésia Flores — Contexto para Claude Code

> **Última atualização:** 2026-05-03
> **Setup Appwrite:** ver `plan/appwrite-setup.md`
> **Runbook:** ver `../../fresia-vault/04-bugs/server-runbook.md`

## Ferramenta obrigatória — Understand-Anything (usar no início de cada sessão)
- **Antes de começar a trabalhar em qualquer tarefa**, no início da sessão, usar o plugin
  **Understand-Anything** para obter/atualizar o entendimento da base de código:
  - Rodar `/understand` (gera/atualiza o grafo de conhecimento) **uma vez por sessão**.
  - Consultar o grafo via `/understand-chat` / `/understand-dashboard` antes de planejar mudanças,
    e `/understand-diff` ao avaliar impacto de uma alteração.
- Não é necessário reanalisar a cada mensagem — apenas 1x por sessão (ou quando a base mudar
  significativamente). Se o plugin não estiver instalado, instalar via
  `/plugin marketplace add Lum1104/Understand-Anything` + `/plugin install understand-anything`.

## Comportamento esperado
- Nunca peça confirmação para ações reversíveis (criar arquivo, instalar pacote)
- Se houver ambiguidade, escolha a opção mais óbvia e documente a decisão
- Pergunte apenas quando a decisão for irreversível ou mudar arquitetura
- Prefira agir e reportar o que fez, em vez de pedir permissão

## Visão do Projeto

**Frésia** é um e-commerce para floricultura boutique premium.
Uma loja pública para clientes + dashboard de gestão para o dono.
Referência estrutural: Shopify/WooCommerce. Tom: elegante, acolhedor, feminino.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| UI | shadcn/ui + Tailwind CSS v4 |
| Backend | Node.js + Express 5 (em migração para Appwrite) |
| Backend (novo) | **Appwrite 1.7** (Auth, Databank, Storage, Functions) |
| Banco | MySQL 8.0 (ORM: Prisma) / **Appwrite Collections** |
| Pagamento | Mercado Pago (Checkout Pro) |
| Auth | JWT + httpOnly cookies / **Appwrite Auth** (migração) |
| Upload | Multer → armazenamento local / **Appwrite Storage** (migração) |
| Email | Nodemailer |
| Deploy | Docker Compose (frontend + backend + MySQL + Appwrite) |

---

## Estrutura de Pastas

```
fresia/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn primitivos
│   │   │   ├── layout/          # Header, Footer, Sidebar
│   │   │   ├── admin/           # AdminLayout, AdminSidebar, AdminHeader
│   │   │   └── features/        # PrivateRoute, AdminRoute
│   │   ├── pages/
│   │   │   ├── store/           # Home, Loja, Produto
│   │   │   ├── checkout/        # Carrinho, Checkout (multi-step), Confirmação
│   │   │   ├── account/         # Conta, Pedidos
│   │   │   └── admin/           # Dashboard, Produtos, Pedidos, Categorias,
│   │   │                        # Clientes (NOVO), Estoque (NOVO),
│   │   │                        # Auditoria (NOVO), Conteúdo (NOVO),
│   │   │                        # Cupons, Promoções, Webhooks, Configs
│   │   ├── hooks/               # useStats
│   │   ├── services/
│   │   │   ├── *.ts             # Axios-based (legacy, ainda em uso)
│   │   │   └── appwrite/        # Appwrite SDK services (NOVO)
│   │   │       ├── authService.ts
│   │   │       ├── productService.ts
│   │   │       ├── inventoryService.ts
│   │   │       ├── customerService.ts
│   │   │       ├── auditService.ts
│   │   │       ├── notificationService.ts
│   │   │       ├── contentService.ts
│   │   │       ├── webhookService.ts
│   │   │       └── catalogService.ts
│   │   ├── store/               # Zustand (cart, auth)
│   │   ├── lib/                 # axios.ts, appwrite.ts, cookies.ts
│   │   └── styles/
│   │       └── tokens.css
│   └── vite.config.ts
│
├── backend/                     # Node + Express (legacy, parcialmente ativo)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── lib/
│   └── server.ts
│
├── plan/
│   ├── 14-new-ideias.md         # PRD completo (20 módulos)
│   └── appwrite-setup.md         # Guia setup Appwrite
│
├── docs/
│   ├── DESIGN_TOKENS.md
│   ├── API_CONTRACTS.md
│   ├── APPWRITE_SCHEMA.md        # Schema Appwrite (22 collections)
│   ├── appwrite-collections.json # JSON para import
│   └── sessions/
│
├── docker-compose.yml
├── docker-compose.appwrite.yml   # Appwrite + MariaDB + Redis
└── CLAUDE.md                    # Este arquivo
```

---

## Design System Frésia v2.0

> Arquivo completo: `docs/DESIGN_TOKENS.md`
> Protótipos HTML: `docs/prototypes/` (gerados pelo Claude Design)

### Paleta (CSS Vars em `tokens.css`)

```css
/* Primária */
--lilac-500: #9b83e6;   /* CTAs, botões principais */
--lilac-600: #8970d9;   /* hover */
--lilac-100: #ece3f7;   /* backgrounds leves */

/* Acento */
--petal-400: #f5a98c;   /* promoções, badges */

/* Sucesso */
--leaf-500: #5a9e68;

/* Texto */
--ink-800: #1f1c26;     /* texto principal */
--ink-500: #6b6579;     /* muted */
--ink-200: #e8e4ef;     /* border */
--ink-50:  #f9f8fc;     /* background */
```

### Tipografia

- Display: **Fraunces** (italic, peso 400–700) — títulos, h1-h3
- Corpo: **DM Sans** (peso 300–700) — navegação, botões, body

### Componentes Chave

- `btn-primary` → ink-900 bg, border-radius pill, hover translateY(-1px)
- `btn-lilac` → lilac-500 bg, shadow ao hover
- `.card` → branco, border ink-200, border-radius 16px
- `.input` → focus ring lilac-500 com opacity 12%
- `.badge-lilac / .badge-petal / .badge-leaf`
- Marca `.brand` → Fraunces italic, lilac-500, dot petal-400 acima

### shadcn — Mapeamento de Tokens

Configurar em `tailwind.config.ts` e `components.json`:
```
primary → lilac-500 (#9b83e6)
secondary → petal-400 (#f5a98c)
background → ink-50 (#f9f8fc)
foreground → ink-800 (#1f1c26)
muted → ink-100 (#f3f1f8)
border → ink-200 (#e8e4ef)
radius → 10px (md), 16px (lg)
```

---

## Entidades Principais (Prisma → Appwrite)

```
User         → id, name, email, passwordHash, phone, isAdmin, addresses[]
Product      → id, name, slug, description, price, stock, images[], categoryId, variants[]
ProductVariant → id, productId, name (ex: "Rosa 3 hastes"), price, stock
Category     → id, name, slug
Order        → id, userId, status, total, deliveryMessage, neighborhoodId, items[]
OrderItem    → id, orderId, productId, variantId, qty, price
Neighborhood → id, name, deliveryFee
Setting      → key, value (pares chave/valor para config da loja)

## NOVAS ENTIDADES (Appwrite)
Customer       → userId, ltv, segment (vip/regular/inactive), notes[], totalOrders, lastOrderAt
InventoryMov   → productId, variantId, type (in/out/reserve/release), qty, reason, orderId, userId
AuditLog       → userId, action, entity, entityId, diff (JSON), ip, createdAt
Notification   → userId, type, message, read, entityType, entityId
Banner         → title, subtitle, image, ctaText, ctaLink, isActive, order
TopBar         → text, activeFrom, activeTo, isActive
Popup          → title, body, ctaText, ctaLink, image, event, delay, frequency, isActive
```

---

## Rotas da API (prefixo `/api/v1`)

### Loja pública
```
GET  /products                  → listagem com filtros/sort
GET  /products/:slug            → detalhe + variantes
GET  /categories                → listagem
GET  /neighborhoods             → lista bairros + frete
POST /orders                    → criar pedido
GET  /orders/:id/track          → rastreamento público
POST /newsletter                → inscrição
```

### Auth
```
POST /auth/login
POST /auth/register
POST /auth/logout
GET  /auth/me
```

### Conta do cliente (`/account/*` — auth obrigatório)
```
GET/PATCH /account/profile
GET       /account/orders
GET       /account/orders/:id
```

### Admin (`/admin/*` — isAdmin obrigatório)
```
CRUD  /admin/products
CRUD  /admin/orders
CRUD  /admin/categories
CRUD  /admin/neighborhoods
CRUD  /admin/promotions
CRUD  /admin/coupons
CRUD  /admin/webhooks
GET   /admin/webhooks/:id/logs
DELETE /admin/webhooks/:id/logs
POST  /admin/webhooks/:id/test
GET   /admin/newsletter
GET   /admin/testimonials
GET   /admin/dashboard/stats
GET/PATCH /admin/settings

## NOVAS ROTAS (Appwrite)
GET   /admin/clientes
GET   /admin/estoque
GET   /admin/auditoria
GET   /admin/conteudo         → banners, top bar, popups
```

### Pagamento
```
POST /payment/create-preference  → cria preferência no MP
POST /payment/webhook            → recebe notificações MP
```

---

## Padrões de Código

### Frontend
- Estado global: **Zustand** (cart, auth)
- Chamadas API legacy: **axios** em `services/` com instância configurada (baseURL, interceptors JWT)
- Chamadas Appwrite: **SDK** em `services/appwrite/` com `lib/appwrite.ts`
- Forms: **React Hook Form** + **Zod** para validação
- Roteamento: **React Router v6**
- Componentes shadcn: nunca modificar os arquivos em `components/ui/` — extender em `components/features/`
- Imagens: lazy loading padrão, WebP preferido

### Backend (Express — legacy, manter até migração completa)
- Controllers apenas validam e delegam para Services
- Services contêm regra de negócio
- Erros via middleware centralizado (`errorHandler.ts`)
- Prisma para todas as queries — nunca SQL raw sem justificativa
- Variáveis sensíveis sempre via `.env` — nunca hardcoded

### Backend (Appwrite — novo)
- SDK client-side: `lib/appwrite.ts` → Account, Databases, Storage, Functions
- Collections mapeadas em `COLLECTIONS` (constante)
- IDs são strings UUID (Appwrite), não números
- Auth via `account.createEmailPasswordSession()` → cookie httpOnly automático
- Admin check via `user.labels.includes('admin')`

### Commits
```
feat(scope): descrição curta
fix(scope): descrição
refactor(scope): descrição
```
Commits pequenos — um por mudança lógica.

---

## Funcionalidades — Status

### ✅ Pronto
- Setup completo (Vite + Express + Prisma + MySQL + Docker)
- Design system (tokens, componentes, animações via Tailwind + shadcn)
- Auth JWT + httpOnly cookies (login, register, me) / Appwrite Auth SDK
- Catálogo com variantes (products, categories)
- Carrinho (Zustand)
- Seleção de bairro + cálculo de frete (neighborhoods)
- Checkout multi-step (identificação → entrega → resumo → pagamento → confirmação)
- Pagamento via Mercado Pago (Checkout Pro)
- Dashboard admin (produtos, pedidos, categorias, fretes, stats)
- Promoções e cupons
- Newsletter e depoimentos
- Webhooks para n8n (CRUD, logs, teste, retry, assinatura HMAC)
- Configurações da loja (settings)
- **Gestão de Clientes** (LTV, segmentação VIP/regular/inativo, notas)
- **Gestão de Estoque** (movimentações, reserva durante checkout, alertas)
- **Auditoria** (logs de todas as ações admin)
- **Notificações** (in-app, email-ready via n8n)
- **Conteúdo** (banners, barra de topo, pop-ups) — UI admin pronta

### 🔨 Em Implementação
- [ ] Campo de mensagem no pedido
- [ ] Rastreamento público de pedidos

### 📋 Pós-MVP
- [ ] Wishlist
- [ ] Reviews/ratings
- [ ] Reset de senha
- [ ] Cache (Redis)
- [ ] Blog



---

## Problemas Conhecidos e Resoluções

> Leia aqui antes de debugar. Documente novos incidentes.
> Runbook completo: `../../fresia-vault/04-bugs/server-runbook.md`

### 1. PrismaClient — Múltiplas instâncias
**Sintoma:** `already has 10 Prisma Client engines actively running`, 500 após uptime, memory leak.
**Causa:** `new PrismaClient()` em cada arquivo. Hot-reload multiplicava.
**Solução:** Singleton em `backend/src/prisma/client.ts`. Nunca usar `new PrismaClient()` — importar só do singleton.

### 2. Admin Middleware Duplicado
**Sintoma:** 401/403 inconsistentes entre rotas admin.
**Causa:** Controllers aplicavam `adminMiddleware` internamente + `server.ts` também.
**Solução:** Middleware só no `server.ts` (`app.use('/api/v1/admin/...', authMiddleware, adminMiddleware, controller)`). Controllers thin — validam e delegam.

### 3. Axios `withCredentials` — Cookies não enviados
**Sintoma:** 401 no frontend admin após login OK.
**Causa:** Instâncias axios sem `withCredentials: true` não enviam cookies httpOnly.
**Solução:** Todos os admin services usam `axios.create({ withCredentials: true })`.

### 4. Porta em uso / Processo fantasma (Windows)
**Sintoma:** `EADDRINUSE :::4000`.
**Solução:** `netstat -ano | findstr :4000` → `taskkill /PID <PID> /F`.
**Prevenção:** `npx kill-port 4000` ou Docker Compose com `restart: unless-stopped`.

### 5. CORS Bloqueando localhost
**Solução:** `server.ts` já usa CORS dinâmico (`origin` callback valida localhost). Em produção, adicionar domínio explícito.

### 6. Respostas inconsistentes (array vs `{data}`)
**Solução:** Listagens = array direto. Recurso único = objeto. Frontend faz fallback: `Array.isArray(res) ? res : res.data ?? []`.

---

## Webhooks e Integração n8n

### Visão Geral
O sistema permite conectar eventos da loja ao **n8n** (ou outros serviços) sem modificar código.
Acesso: **Painel Admin → `/admin/webhooks`**.

### Eventos
| Evento | Dispara quando |
|--------|---------------|
| `order.created` | Novo pedido recebido |
| `order.updated` | Status do pedido alterado |
| `order.paid` | Pagamento confirmado |
| `product.low_stock` | Estoque ≤ 5 unidades |
| `newsletter.subscribed` | Nova inscrição na newsletter |
| `testimonial.created` | Novo depoimento enviado |

### Configurar no n8n
1. No n8n, crie um workflow com trigger **Webhook**
2. Copie a URL (ex: `https://n8n.seudominio.com/webhook/fresia-pedidos`)
3. No painel Frésia (`/admin/webhooks`), clique **Novo Webhook**
4. Cole a URL, selecione os eventos, ative
5. Use o botão **Testar** para enviar payload de exemplo
6. Verifique os **logs** de entrega (HTTP status, resposta)

### Payload de Exemplo (`order.created`)
```json
{
  "event": "order.created",
  "timestamp": "2026-05-02T14:30:00.000Z",
  "data": {
    "id": 123,
    "status": "pending",
    "total": 149.90,
    "customerName": "Maria Silva",
    "customerEmail": "maria@email.com",
    "items": [
      { "productName": "Buquê Rosas Vermelhas", "qty": 1, "price": 149.90 }
    ]
  }
}
```

### Headers
- `Content-Type: application/json`
- `X-Fresia-Event: <evento>` (ex: `order.created`)
- `X-Fresia-Signature: <hmac-sha256>` (se configurado secret)

### Validar Assinatura HMAC no n8n
Adicione um nó **Function** após o Webhook Trigger:
```javascript
const crypto = require('crypto');
const secret = 'SEU_SECRET';
const headers = $input.first().json.headers;
const body = JSON.stringify($input.first().json.body);
const received = headers['x-fresia-signature'];
const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
if (!received || received !== expected) throw new Error('Assinatura inválida');
return $input.all();
```

### Checklist de Diagnóstico — Webhooks
1. O webhook está **Ativo** no painel? (badge verde)
2. O n8n está acessível da máquina do backend? Testar com cURL
3. Verificar **Logs** do webhook no painel (clicar no ícone de olho)
4. HTTP status ≠ 2xx → o n8n está rejeitando (ver logs do n8n)
5. "Falha na conexão" sem status → rede/URL inacessível
6. Assinatura inválida → o `secret` no Frésia e no n8n não batem

### Manutenção
- Logs acumulam → usar **Limpar logs** no painel periodicamente
- Webhooks inativos não são chamados (não geram tráfego)
- O timeout de envio é 15s — via n8n, mantenha workflows simples

---

## Regras de Segurança

1. Sanitizar inputs no servidor (express-validator)
2. Senhas com bcrypt (rounds ≥ 12)
3. JWT em httpOnly cookies — nunca localStorage
4. Rate limiting em `/auth/*` e `/payment/*`
5. Uploads: validar MIME + limitar tamanho (5MB)
6. CORS configurado explicitamente (não `*` em produção)

---

## Contexto para cada sessão

**Início de sessão:**
1. Ler este arquivo
2. Ler `docs/sessions/` — último arquivo de changelog
3. Confirmar o objetivo da sessão antes de codar

**Fim de sessão:**
1. Gerar `docs/sessions/YYYY-MM-DD.md` com:
   - O que foi implementado
   - Decisões tomadas
   - Pendências e próximos passos

**Nunca:**
- Escrever código antes de ter o plano aprovado
- Modificar componentes shadcn em `components/ui/`
- Hardcodar credenciais ou URLs

---

**Versão:** 3.0
**Última atualização:** 3 de Maio de 2026
**Migração Appwrite:** em curso (Mai/2026)
**Stack inicial migrada de PHP → React+Vite+Node (Abr/2026)**
