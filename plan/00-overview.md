# Plano Geral — Frésia (Estado Atual + Pendências)

> **Atualizado em:** 2026-05-02
> **Pasta de planos:** `fresia/plan/`
> **Stack:** Frontend React 18 + Vite 5 (porta 5173) · Backend Express 5 + Prisma + MySQL (porta 4000)

---

## 1. Sumário Executivo

A conexão básica frontend ↔ backend foi corrigida: backend roda em `4000`, MySQL conectado, CORS dinâmico, proxy do Vite ajustado. **A loja pública (home, listagem de produtos, login) funciona.**

Porém, o **CRUD admin** não sincroniza por causa de **3 categorias de problemas**:

| # | Problema | Impacto | Prioridade |
|---|----------|---------|------------|
| A | Rotas admin de **products / promotions / stats / newsletter** registradas SEM `authMiddleware` antes do `adminMiddleware` | Toda requisição admin desses módulos retorna `403 "Acesso negado"` (porque `adminMiddleware` lê `req.user` que só é definido por `authMiddleware`) | 🔴 P0 |
| B | Endpoints **admin de categorias** não existem no backend, mas o frontend chama `POST/PUT/DELETE /api/v1/admin/categories` | `404` ao criar/editar/excluir categorias | 🔴 P0 |
| C | Endpoints **admin de pedidos** não existem no backend, mas o frontend chama `GET/PATCH /api/v1/admin/orders` | `404` ao listar/atualizar status de pedidos | 🔴 P0 |

Há também problemas menores (ProductForm com campo `active` em vez de `isActive`, services sem refetch após mutation, faltam validações de payload). Cada módulo tem um plano dedicado em arquivo separado.

---

## 2. O Que Já Foi Feito ✅

### Infraestrutura
- [x] Backend Express + Prisma rodando em `localhost:4000`
- [x] MySQL conectado via `DATABASE_URL="mysql://root:@localhost:3306/fresia"`
- [x] Frontend Vite em `localhost:5173`, proxy `/api` → `localhost:4000`
- [x] CORS dinâmico aceita qualquer `localhost:*`
- [x] `cookieParser` configurado, cookies `HttpOnly` para token JWT
- [x] Seed do banco com admin user (`constantino.dev.br@gmail.com` / `Lets291224#`)
- [x] 12 produtos, categorias, depoimentos populados

### Loja pública
- [x] Home com categorias, produtos em destaque, promoções, depoimentos
- [x] `StorePage`, `ProductPage`, busca, carrinho (`CartSheet`)
- [x] Login / Registro (com cookie JWT)
- [x] Checkout, integração Mercado Pago (`MP_ACCESS_TOKEN` configurado)
- [x] Newsletter subscribe público

### Admin (parcialmente funcional)
- [x] **Depoimentos** (`/admin/depoimentos`) — funciona end-to-end (rotas têm middleware correto dentro do controller)
- [x] **Cidades / Bairros** (`/admin/fretes`) — funciona (server.ts registra com `authMiddleware, adminMiddleware`)
- [x] Layouts admin: `AdminLayout`, `AdminSidebar`, `AdminHeader`
- [x] Componentes: `DataTable` (com `exportable: csv`), `StatCard`, `Charts`
- [x] Páginas criadas (mas quebradas no fluxo): `ProductList/Form`, `CategoryList`, `PromotionList/Form`, `OrderList`, `NewsletterPage`

---

## 3. O Que Falta (Detalhado em Planos por Módulo)

| Módulo | Plano | Problema principal |
|--------|-------|--------------------|
| **Auth & Middleware** | [`01-auth-middleware-fix.md`](./01-auth-middleware-fix.md) | `server.ts` não passa `authMiddleware` antes de `adminMiddleware` em 4 rotas |
| **Produtos admin** | [`02-products-admin.md`](./02-products-admin.md) | Backend OK, mas rota sem `authMiddleware`. Form envia `active`, backend espera `isActive`. Sem refetch após mutation. |
| **Categorias admin** | [`03-categories-admin.md`](./03-categories-admin.md) | Backend não tem `create/update/delete`. Precisa criar controller, service, rota. |
| **Promoções admin** | [`04-promotions-admin.md`](./04-promotions-admin.md) | Backend OK, mas rota sem `authMiddleware`. |
| **Pedidos admin** | [`05-orders-admin.md`](./05-orders-admin.md) | Backend não tem `getAll/getById/updateStatus`. Precisa criar controller, service, rota. |
| **Newsletter admin** | [`06-newsletter-admin.md`](./06-newsletter-admin.md) | Rota sem `authMiddleware`. Inseguro. |
| **Estatísticas admin** | [`07-stats-admin.md`](./07-stats-admin.md) | Rota sem `authMiddleware`. |
| **Limpeza & Verificação** | [`08-cleanup-verification.md`](./08-cleanup-verification.md) | Múltiplas instâncias do PrismaClient, falta de `tsc --noEmit`, smoke test E2E. |

---

## 4. Causa Raiz dos 403 / 404 nos Admin

### 4.1. Por que retorna 403 mesmo logado como admin?

O `adminProductController.ts` faz isso:
```ts
router.post('/', adminMiddleware, async (req, res) => { ... })
```

E `adminMiddleware.ts`:
```ts
export function adminMiddleware(req, res, next) {
  const user = (req as any).user
  if (!user?.isAdmin) return res.status(403).json({ error: 'Acesso negado' })
  next()
}
```

Mas `req.user` só é definido por `authMiddleware` (que lê `req.cookies?.token` e faz `jwt.verify`). Se `authMiddleware` não roda antes, `req.user` é `undefined`, e o `adminMiddleware` retorna **403**.

No `server.ts`, a linha:
```ts
app.use('/api/v1/admin/products', adminProductController)
```
**não passa por `authMiddleware`**. Comparar com:
```ts
app.use('/api/v1/admin/cities', authMiddleware, adminMiddleware, adminCitiesRouter)  // ✅ correto
```

### 4.2. Por que retorna 404 em categorias e pedidos?

Os controllers/services admin desses módulos simplesmente **não existem** no backend. O frontend chama endpoints que não estão registrados.

---

## 5. Ordem de Execução Recomendada

```
1. 01-auth-middleware-fix.md         (1 arquivo, 4 linhas — corrige 4 módulos de uma vez)
2. 03-categories-admin.md            (cria controller + service + rota)
3. 05-orders-admin.md                (cria controller + service + rota)
4. 02-products-admin.md              (corrige isActive + refetch)
5. 04-promotions-admin.md            (smoke test após auth fix)
6. 06-newsletter-admin.md            (smoke test após auth fix)
7. 07-stats-admin.md                 (smoke test após auth fix)
8. 08-cleanup-verification.md        (PrismaClient singleton + tsc + E2E)
```

A correção de auth no passo 1 é a de maior impacto: sozinha desbloqueia produtos, promoções, newsletter e stats.

---

## 6. Estado por Módulo (Tabela Mestre)

| Módulo | Backend Controller | Backend Service | Backend Rota com Auth | Frontend Service | Frontend Página | Status |
|--------|-------------------|-----------------|------------------------|------------------|-----------------|--------|
| Produtos | ✅ | ✅ | ❌ | ✅ | ✅ | 🔴 Não funciona |
| Categorias | ❌ admin | ⚠️ só getAll | ❌ | ✅ | ✅ | 🔴 Não funciona |
| Promoções | ✅ | ✅ | ❌ | ✅ | ✅ | 🔴 Não funciona |
| Pedidos | ❌ admin | ⚠️ só create | ❌ | ✅ | ✅ | 🔴 Não funciona |
| Depoimentos | ✅ | ✅ | ✅ (no controller) | ✅ | ✅ | 🟢 Funciona |
| Newsletter | ✅ | ✅ | ❌ | ✅ | ✅ | 🔴 Inseguro |
| Stats | ✅ | ✅ | ❌ | ✅ | ✅ | 🟡 Insecure |
| Cidades/Bairros | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 Funciona |

---

## 7. Verificação Final (após executar todos os planos)

1. `cd backend && npx tsc --noEmit` — sem erros TypeScript.
2. `cd frontend && npx tsc --noEmit` — sem erros TypeScript.
3. **Smoke test manual:**
   - Login admin (`constantino.dev.br@gmail.com` / `Lets291224#`)
   - Criar produto novo → aparece na home e em `/admin/produtos`
   - Criar categoria → aparece no select de categorias do form de produto
   - Criar promoção vinculada a um produto → aparece em `/promocoes`
   - Cliente cria pedido → aparece em `/admin/pedidos`
   - Mudar status do pedido → cliente vê novo status em `/conta`
   - Listar/exportar newsletter subscribers
   - Dashboard `/admin` mostra KPIs reais
4. Sem erros no console do browser nem no log do backend.

---

## 8. Notas / Decisões

- **Auth via cookie HttpOnly:** mantém-se. Frontend tem `withCredentials: true` em todos os services. A leitura de `document.cookie` para `Authorization: Bearer` é redundante (cookie é HttpOnly), mas não atrapalha — pode ser removido em cleanup.
- **PrismaClient:** vários services instanciam `new PrismaClient()`. Padronizar em um singleton em `@/prisma/client` é pequeno débito técnico — abordado em `08-cleanup-verification.md`.
- **TypeScript strict:** está desabilitado (`"strict": false`). Não vamos ligar agora — escopo deste plano é fazer o CRUD funcionar.
