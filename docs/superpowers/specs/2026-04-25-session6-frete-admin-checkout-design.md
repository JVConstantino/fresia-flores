# Design: Sessão 6 — Frete (Admin Config) + Checkout

**Data:** 2026-04-25
**Status:** Aprovado

---

## Objetivo

Implementar o sistema completo de entrega: migração de schema (City + Neighborhood), seed com Nova Friburgo/RJ e 109 bairros, admin CRUD de fretes, e página de checkout com busca de CEP via ViaCEP, seleção de bairro/motoboy, dados pessoais, mensagem e criação do pedido.

---

## Decisões

| Decisão | Escolha |
|---------|---------|
| Transportadora | Estrutura no schema mas "em breve" no checkout (só motoboy agora) |
| Admin user | Seed com `constantino.dev.br@gmail.com`, hash bcrypt da senha |
| CEP lookup | ViaCEP (`viacep.com.br/ws/{cep}/json/`) — sem chave de API |
| Checkout steps | 4: Entrega → Dados → Mensagem → Confirmação |
| `neighborhoodId` em Order | Nullable — transportadora futura não exige bairro |
| Admin layout | Sidebar fixa + conteúdo principal |

---

## Schema (Prisma)

### Novos modelos

```prisma
model City {
  id            Int            @id @default(autoincrement())
  name          String
  state         String
  ibgeCode      String?
  neighborhoods Neighborhood[]
}
```

### Neighborhood (atualizado — adicionar cityId, isActive; manter orders[])

```prisma
model Neighborhood {
  id          Int      @id @default(autoincrement())
  cityId      Int
  name        String
  deliveryFee Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  city        City     @relation(fields: [cityId], references: [id])
  orders      Order[]
}
```

### Order (adicionar deliveryMethod, tornar neighborhoodId nullable)

```prisma
model Order {
  ...
  deliveryMethod  String       @default("motoboy")
  neighborhoodId  Int?
  neighborhood    Neighborhood? @relation(fields: [neighborhoodId], references: [id])
  customerName    String
  customerEmail   String
  customerPhone   String?
}
```

> **Nota:** `customerName/Email/Phone` são adicionados ao Order para preservar dados do comprador no momento da compra (independente de mudanças no perfil).

---

## Seed (prisma/seed.ts — atualizado)

### Admin user
```
email: constantino.dev.br@gmail.com
password: hash bcrypt de "Lets291224#"
isAdmin: true
name: "Constantino"
```

### Cidade + 109 bairros
```
Nova Friburgo, RJ
ibgeCode: "3303401"
```

Bairros completos com taxas (lista fornecida pelo usuário — ver abaixo no plano).

---

## Backend

### Novos arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `backend/src/services/cityService.ts` |
| Criar | `backend/src/services/neighborhoodService.ts` |
| Criar | `backend/src/services/orderService.ts` |
| Criar | `backend/src/controllers/cityController.ts` |
| Criar | `backend/src/controllers/neighborhoodController.ts` |
| Criar | `backend/src/controllers/orderController.ts` |
| Criar | `backend/src/routes/cities.ts` (público) |
| Criar | `backend/src/routes/neighborhoods.ts` (público) |
| Criar | `backend/src/routes/orders.ts` |
| Criar | `backend/src/routes/admin/cities.ts` |
| Criar | `backend/src/routes/admin/neighborhoods.ts` |
| Modificar | `backend/src/server.ts` |

### Rotas públicas

```
GET /api/v1/cities
  → [{ id, name, state, _count: { neighborhoods } }]

GET /api/v1/neighborhoods?cityId=N
  → [{ id, name, deliveryFee }] (isActive=true)

POST /api/v1/orders  [authMiddleware]
  body: {
    items: [{ productId, variantId?, qty, price }],
    neighborhoodId: number,
    deliveryMethod: "motoboy",
    deliveryMessage?: string,
    customerName: string,
    customerEmail: string,
    customerPhone?: string
  }
  → { id, status, total }
```

### Rotas admin (authMiddleware + adminMiddleware)

```
GET    /api/v1/admin/cities
POST   /api/v1/admin/cities
PATCH  /api/v1/admin/cities/:id
DELETE /api/v1/admin/cities/:id

GET    /api/v1/admin/neighborhoods?cityId=N
POST   /api/v1/admin/neighborhoods
PATCH  /api/v1/admin/neighborhoods/:id
DELETE /api/v1/admin/neighborhoods/:id
```

### adminMiddleware

```typescript
// Checa (req as any).user.isAdmin === true
// Se não: 403 Forbidden
```

### orderService.create

```typescript
// 1. Buscar neighborhood para pegar deliveryFee
// 2. Calcular total: soma(items.price * qty) + deliveryFee
// 3. Criar Order + OrderItems em transação Prisma
// 4. Retornar { id, status, total }
```

---

## Frontend

### Novos arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `frontend/src/components/features/AdminRoute.tsx` |
| Criar | `frontend/src/components/layout/AdminLayout.tsx` |
| Criar | `frontend/src/pages/admin/AdminDashboard.tsx` |
| Criar | `frontend/src/pages/admin/AdminFretesPage.tsx` |
| Criar | `frontend/src/pages/checkout/CheckoutPage.tsx` (substituir placeholder) |
| Criar | `frontend/src/pages/checkout/OrderConfirmationPage.tsx` |
| Criar | `frontend/src/services/neighborhoodService.ts` |
| Criar | `frontend/src/services/orderService.ts` |
| Modificar | `frontend/src/App.tsx` — rotas /admin/*, /pedido/:id |

### AdminRoute.tsx

```tsx
// const { user, isLoading } = useAuthStore()
// if isLoading → spinner
// if !user || !user.isAdmin → <Navigate to="/" />
// return children
```

### AdminLayout.tsx

```
div flex h-screen
  Sidebar (w-64, bg-ink-800):
    Logo "Frésia" (lilac)
    Nav links:
      /admin → Dashboard
      /admin/fretes → Cidades e Fretes
    Footer: nome do usuário + link Sair
  main (flex-1, overflow-y-auto, bg-ink-50):
    {children}
```

### AdminFretesPage.tsx (`/admin/fretes`)

```
Título "Cidades e Fretes"
[+ Nova Cidade] button (abre Dialog)

Para cada cidade:
  Accordion/card com:
    Header: "Nova Friburgo, RJ" + contagem bairros + [+ Bairro] [Editar] [Excluir]
    Tabela:
      Nome | Frete | Ativo | Ações
      [linha] [linha] ... paginação 20/página
    
Dialogs (shadcn):
  CreateCityDialog: nome, estado
  EditCityDialog: nome, estado
  CreateNeighborhoodDialog: cityId, nome, frete, isActive
  EditNeighborhoodDialog: nome, frete, isActive
  ConfirmDeleteDialog: "Tem certeza?"
```

### CheckoutPage.tsx (4 steps)

```tsx
// Estado: step (1|2|3|4), cep, address, neighborhoods,
//         selectedNeighborhood, deliveryFee, customerData, message

// Step 1 — Entrega
  Input CEP + botão buscar
  → fetch https://viacep.com.br/ws/{cep}/json/
  → GET /api/v1/cities → checar se localidade bate
  → Se bate: GET /neighborhoods?cityId=N → dropdown bairros
  → Exibe: bairro selecionado + "Taxa: R$ XX"
  → Se não bate: "Entrega via transportadora — em breve"
  → [Continuar] → step 2

// Step 2 — Dados
  Nome (pré-fill user.name), Email (pré-fill), Telefone (pré-fill)
  Rua (do CEP), Número, Complemento
  [Continuar] → step 3

// Step 3 — Mensagem
  Textarea mensagem cartão (max 120)
  Resumo dos itens do carrinho
  [Continuar] → step 4

// Step 4 — Confirmação
  Resumo completo:
    Itens + qtd + preço
    Entrega: bairro + R$ taxa
    Total: subtotal + frete
  [Finalizar pedido] → POST /orders → navegar /pedido/:id
```

### OrderConfirmationPage.tsx (`/pedido/:id`)

```
Layout padrão
Ícone ✓ verde
"Pedido #ID confirmado!"
"Em breve entraremos em contato"
Data do pedido + itens resumidos
[Continuar comprando] → /loja
```

---

## Critérios de Sucesso

1. `npx prisma migrate dev` aplica schema sem erro
2. `npm run seed` cria admin + cidade + 109 bairros
3. Login como admin → `/admin/fretes` mostra Nova Friburgo com bairros em tabela
4. CRUD de bairros no admin: criar, editar frete, desativar
5. CEP `28625-000` (Nova Friburgo) → busca retorna city + bairros
6. Selecionar bairro no checkout → taxa correta exibida
7. Finalizar pedido → Order criado no banco + carrinho limpo + página de confirmação

---

## Fora do Escopo

- Transportadora/Correios (estrutura existe, integração futura)
- Rastreamento de pedido público `/orders/:id/track`
- Admin completo de pedidos (Sessão futura)
- Pagamento Mercado Pago (Sessão futura)
