# Spec: Melhorias Loja Pública + Admin — Frésia
**Data:** 2026-05-16  
**Status:** Aprovado pelo usuário

---

## Contexto

O projeto Frésia tem duas grandes frentes a melhorar:

1. **Loja pública** — ProductCard sem link, sem wishlist, sem quick view; Mega Menu pequeno e baseado em clique; StorePage com layout de sidebar ultrapassado
2. **Admin** — ProductForm com 6 campos apenas; DataTable sem filtros nem seleção múltipla; 4 páginas usando Appwrite SDK ao invés do MySQL/Express que é o banco real do projeto

A decisão foi dividir em dois planos independentes para reduzir risco e facilitar testes.

---

## Plano 1 — Loja Pública

### 1.1 ProductCard

**Arquivo:** `frontend/src/components/features/ProductCard.tsx`

**Mudanças:**
- Imagem aumentada para 220px de altura
- Nome e imagem clicáveis → navegam para `/produto/:slug`
- Hover na imagem revela overlay com dois botões:
  - "Ver Produto" → link para `/produto/:slug`
  - "Visualização Rápida" → abre `QuickViewDialog` com o produto
- Ícone de coração no canto superior esquerdo — estado vem do `useWishlistStore`
- Badge "Últimas X unidades" quando `stock <= 5 && stock > 0`
- Badge de desconto mantido no canto superior direito
- Botão "Adicionar ao carrinho" mantido na parte inferior

**QuickViewDialog** (`frontend/src/components/features/QuickViewDialog.tsx`):
- Já existe mas não está conectado nas páginas (Home, Store)
- Conectar via `useState<Product | null>` em `HomePage` e `StorePage`
- Passar `setQuickViewProduct` para `ProductCard` via prop `onQuickView`

### 1.2 Wishlist (híbrida)

**Arquivos novos/modificados:**
- `frontend/src/store/wishlistStore.ts` — Zustand com `persist` em localStorage
- `frontend/src/hooks/useWishlist.ts` — hook `{ isFavorited, toggle }` por productId
- `backend/prisma/schema.prisma` — nova tabela `Wishlist` (`id`, `userId`, `productId`, `createdAt`)
- `backend/src/routes/account.ts` — `POST /account/wishlist/:productId`, `DELETE /account/wishlist/:productId`, `GET /account/wishlist`
- `backend/src/controllers/wishlistController.ts`

**Comportamento:**
- Não logado: persiste só em localStorage
- Logado: persiste no MySQL. Na inicialização do app (`main.tsx`), após `initAuth()`, se usuário logado faz merge do localStorage com o banco (union, sem duplicatas)
- `useWishlist(productId)` retorna `{ isFavorited: boolean, toggle: () => void }`

### 1.3 Mega Menu

**Arquivo:** extrair de `Header.tsx` → novo `frontend/src/components/layout/MegaMenu.tsx`

**Comportamento:**
- Abre no hover sobre "Categorias" com delay de 150ms (evita abertura acidental)
- Fecha ao mover o mouse para fora do painel ou do trigger
- Implementado com `onMouseEnter`/`onMouseLeave` + `setTimeout` para o delay

**Layout (860px, 2 colunas):**
- **Coluna esquerda (260px):** lista vertical de categorias com hover highlight. Hover em uma categoria atualiza o painel direito
- **Coluna direita (560px):** grid 3×2 de produtos da categoria em destaque — foto real (`<img>` do campo `images`), nome, preço, link para `/produto/:slug`
- **Rodapé:** "Ver todos os produtos →" e "Ver todas as categorias →"

**Estado:** `hoveredCategoryId` (inicia com a primeira categoria)

**Cache de produtos:** `Map<categoryId, Product[]>` local. Ao fazer hover em uma categoria pela primeira vez, chama `productService.findAll([categoryId], 'newest', 6)` e guarda no Map. Hoveres subsequentes usam o cache sem nova request.

**Header.tsx:** remove lógica do menu inline, importa `<MegaMenu>` como componente

### 1.4 StorePage — Reformulação completa

**Arquivo:** `frontend/src/pages/store/StorePage.tsx`

**Layout:**
- Remove sidebar lateral completamente
- **Banner de categoria** no topo: imagem de fundo da categoria selecionada (ou banner genérico), nome e contagem. Altura 200px, overlay escuro gradiente

**Barra de filtros horizontal:**
- Chips de categoria em scroll horizontal
- Input de preço mín/máx
- Toggle "Em destaque" (filtra `isFeatured=true`)
- Toggle "Com promoção" (filtra produtos com `salePrice`)
- Select de ordenação (mais recentes / menor preço / maior preço)
- Input de busca por texto com debounce 400ms
- Alternador grid/lista (ícones)

**Filtros ativos:** chips removíveis abaixo da barra ("Categoria: Rosas ✕")

**URL driven:** todos os filtros em query params (`?categoria=rosas&preco_max=150&destaque=1&search=rosa`) — browser back funciona, URL é compartilhável

**Grid:** 4 colunas desktop, 2 tablet. Cards com imagem 260px
**Lista:** linha horizontal — imagem 80px quadrada, nome, descrição curta, preço, botão adicionar
**Paginação:** botão "Ver mais X produtos" (append, não troca página)

**Backend:** endpoint `GET /products` já existe — adicionar suporte a query params `preco_min`, `preco_max`, `isFeatured`, `salePrice` no controller/service

---

## Plano 2 — Admin (integra ao plano existente)

> O plano admin anterior já cobre: ProductForm completo, DataTable padronizado, filtros nas tabelas, padronização visual. Este plano adiciona a remoção do Appwrite e implementação MySQL das 4 páginas.

### 2.1 Remoção do Appwrite

**Remover:**
- `frontend/src/lib/appwrite.ts`
- `frontend/src/services/appwrite/` (8 arquivos: authService, productService, inventoryService, customerService, auditService, notificationService, contentService, webhookService, catalogService)
- Pacote `appwrite` do `frontend/package.json`

**Reescrever do zero (usando axios → Express/MySQL):**
- `frontend/src/pages/admin/CustomersPage.tsx`
- `frontend/src/pages/admin/InventoryPage.tsx`
- `frontend/src/pages/admin/AuditPage.tsx`
- `frontend/src/pages/admin/ContentPage.tsx`

### 2.2 Novas tabelas Prisma (MySQL)

```prisma
model CustomerProfile {
  id           Int      @id @default(autoincrement())
  userId       Int      @unique
  segment      String   @default("regular") // vip | regular | inactive
  notes        String?  @db.Text            // JSON array de strings
  ltv          Decimal  @db.Decimal(10, 2) @default(0)
  totalOrders  Int      @default(0)
  lastOrderAt  DateTime?
  user         User     @relation(fields: [userId], references: [id])
}

model InventoryMovement {
  id        Int      @id @default(autoincrement())
  productId Int
  variantId Int?
  type      String   // in | out | reserve | release
  qty       Int
  reason    String?
  orderId   Int?
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id])
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  action    String   // create | update | delete
  entity    String   // product | order | category | coupon | customer
  entityId  Int
  diff      String?  @db.Text  // JSON
  ip        String?
  createdAt DateTime @default(now())
}

model Banner {
  id        Int      @id @default(autoincrement())
  title     String
  subtitle  String?
  image     String   @db.Text
  ctaText   String?
  ctaLink   String?
  isActive  Boolean  @default(true)
  order     Int      @default(0)
  createdAt DateTime @default(now())
}

model TopBar {
  id         Int      @id @default(autoincrement())
  text       String
  activeFrom DateTime?
  activeTo   DateTime?
  isActive   Boolean  @default(true)
}

model Popup {
  id        Int      @id @default(autoincrement())
  title     String
  body      String   @db.Text
  ctaText   String?
  ctaLink   String?
  image     String?  @db.Text
  event     String   @default("onload") // onload | onExit | onScroll
  delay     Int      @default(3)
  frequency String   @default("once")  // once | always | session
  isActive  Boolean  @default(true)
}

model Wishlist {
  id        Int      @id @default(autoincrement())
  userId    Int
  productId Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
  @@unique([userId, productId])
}
```

### 2.3 Novos endpoints Express

**Clientes:**
- `GET /admin/customers` — lista com filtros (segment, search)
- `GET /admin/customers/:id` — detalhe + histórico de pedidos
- `PATCH /admin/customers/:id` — atualizar segment, notas
- `POST /admin/customers/:id/notes` — adicionar nota

**Estoque:**
- `GET /admin/inventory` — lista movimentações com filtros
- `POST /admin/inventory` — registrar movimentação manual

**Auditoria:**
- `GET /admin/audit` — lista logs com filtros (entity, action, userId, data)

**Conteúdo:**
- `GET/POST/PUT/DELETE /admin/banners`
- `GET/POST/PUT/DELETE /admin/topbar`
- `GET/POST/PUT/DELETE /admin/popups`

**Wishlist (conta do cliente):**
- `GET /account/wishlist`
- `POST /account/wishlist/:productId`
- `DELETE /account/wishlist/:productId`

### 2.4 Middleware de Auditoria

Middleware Express `auditMiddleware` que intercepta respostas de sucesso em rotas admin com métodos POST/PUT/DELETE e registra automaticamente um `AuditLog`. Aplicado no `server.ts` nas rotas `/api/v1/admin/*`.

---

## Ordem de execução

### Plano 1 (Loja)
1. `wishlistStore.ts` + `useWishlist.ts` hook
2. Backend: schema Wishlist + migrate + wishlistController + routes
3. `ProductCard.tsx` — todas as melhorias visuais + wishlist + quick view wiring
4. `HomePage.tsx` e `StorePage.tsx` — conectar `onQuickView`
5. `MegaMenu.tsx` — extrair e reescrever
6. `Header.tsx` — usar `<MegaMenu>`
7. `StorePage.tsx` — reformulação completa
8. Backend: adicionar query params de filtro ao `GET /products`

### Plano 2 (Admin)
1. Schema Prisma — todas as novas tabelas + migrate
2. Backend controllers + routes (customers, inventory, audit, content)
3. Middleware de auditoria
4. Remover `appwrite` do frontend
5. Reescrever as 4 páginas admin
6. ProductForm completo (do plano anterior)
7. DataTable padronizado (do plano anterior)
8. Padronização das demais páginas

---

## Verificação

### Plano 1
- Clicar no card navega para `/produto/:slug`
- Hover na imagem mostra overlay com "Ver Produto" e "Visualização Rápida"
- Quick View abre dialog com produto correto
- Favoritar sem login → persiste no localStorage após reload
- Favoritar com login → persiste no banco, aparece em outro browser
- Login com itens no localStorage → itens são sincronizados com o banco
- Mega Menu abre no hover após 150ms, fecha ao sair
- Hover em categoria diferente atualiza produtos do painel direito sem nova request (cache)
- StorePage: todos os filtros refletem na URL
- Botão "Ver mais" appenda produtos sem recarregar a página

### Plano 2
- `import from 'appwrite'` não existe mais em nenhum arquivo
- Clientes carregam via Express/MySQL
- Registrar movimentação de estoque salva no banco
- Ação admin (ex: deletar produto) gera `AuditLog` automaticamente
- Banners CRUD funcionando via formulário
