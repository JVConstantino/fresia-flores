# Session 8: Home Page Completa + Dashboard Admin — Design Spec

> **Objetivo:** Implementar Home Page com busca, categorias, promoções, newsletter, testimonials + Dashboard Admin completo com stats, CRUD produtos/categorias/promoções, gerenciamento de pedidos e gráficos avançados.

> **Escopo:** Uma sessão - Home Page (seções principais) + Dashboard Admin (visão geral + CRUDs essenciais)

---

## 1. HOME PAGE

### 1.1 Layout & Estrutura

**E-commerce Classic Flow:**
```
1. Hero Section (Hero Banner com Busca)
2. Busca + Categorias (navegação)
3. Promoções (destaque)
4. Produtos Trending (bestsellers)
5. Newsletter (inscrição)
6. Testimonials (reviews de clientes)
7. Footer
```

### 1.2 Seções Detalhadas

**Hero Section:**
- Imagem de fundo (flores)
- Frase chamativa: "Flores frescas entregues com cuidado"
- Input de busca integrado com ícone lupa
- CTA "Ver Loja" (link para /loja)

**Busca + Categorias:**
- Campo de busca com debounce (busca em tempo real)
- Grid de 4-5 categorias com cards:
  - Ícone/imagem da categoria
  - Nome
  - Quantidade de produtos
  - Link clicável

**Promoções:**
- Banner destaque: "Flores em promoção"
- Grid de produtos em promoção com:
  - Imagem
  - Nome
  - Preço original (riscado) + Preço com desconto
  - Badge "desconto X%"
  - Botão "Adicionar ao carrinho"

**Produtos Trending:**
- Grid similar com best-sellers
- Mesmos cards de produtos

**Newsletter:**
- Seção com fundo destacado
- Título + descrição
- Input email
- Botão "Inscrever"
- Validação: email único, máximo 100 caracteres
- Resposta: Toast "Inscrito com sucesso" ou erro se duplicado

**Testimonials:**
- Carrossel ou grid de 3-4 reviews ativos
- Card com:
  - Avatar/foto
  - Nome do cliente
  - Texto do comentário
  - Rating (⭐⭐⭐⭐⭐)
  - Data

### 1.3 Componentes Frontend

**Novos:**
- `HomePage.tsx` - Página principal
- `ProductCard.tsx` - Card reutilizável (imagem, nome, preço, desconto, botão)
- `CategoryCard.tsx` - Card de categoria
- `TestimonialCard.tsx` - Card de review
- `SearchBar.tsx` - Busca com debounce
- `NewsletterSection.tsx` - Seção inscrição

**Existentes reutilizados:**
- Button, Input, Layout, Footer

### 1.4 API Necessária (Backend)

```
GET /api/v1/products?limit=20&search=QUERY
  → Lista produtos com busca

GET /api/v1/categories
  → Lista categorias

GET /api/v1/promotions/active
  → Promoções ativas (data válida hoje)

GET /api/v1/testimonials
  → Reviews ativos

POST /api/v1/newsletter/subscribe
  Body: { email: string }
  → Inscreve email
  Validação: email único, ativo por padrão
  Resposta: 201 { id, email, createdAt } ou 409 se duplicado
```

### 1.5 Dados & Relacionamentos

**Tabela `Promotion`** (nova):
```prisma
model Promotion {
  id              Int      @id @default(autoincrement())
  name            String   // ex: "Flores de Primavera"
  description     String?  @db.Text
  discountType    String   // "percentage" | "fixed"
  discountValue   Decimal  @db.Decimal(10, 2) // ex: 10 ou 5.00
  validFrom       DateTime
  validTo         DateTime
  isActive        Boolean  @default(true)
  products        Product[] // relação muitos-para-muitos
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Adiciona a `Product`:
```prisma
promotions   Promotion[]
```

**Tabela `Testimonial`** (nova):
```prisma
model Testimonial {
  id          Int     @id @default(autoincrement())
  clientName  String
  rating      Int     // 1-5
  text        String  @db.Text
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Tabela `NewsletterSubscription`** (nova):
```prisma
model NewsletterSubscription {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 2. DASHBOARD ADMIN

### 2.1 Navegação & Estrutura

**Sidebar (fixo, esquerda):**
- Logo "Fresia Admin"
- Menu vertical:
  - Dashboard (overview)
  - Produtos (CRUD + lista)
  - Categorias (CRUD)
  - Pedidos (lista + status)
  - Promoções (CRUD)
  - Cidades e Fretes (já existe)
  - Configurações (placeholder)
- Usuário logado + Logout

**Header (topo):**
- Breadcrumb ou página atual
- Usuário + data
- Botão logout

**Páginas:**
```
/admin                          → Dashboard (overview)
/admin/produtos                 → Tabela de produtos
/admin/produtos/novo            → Novo produto (form)
/admin/produtos/:id             → Editar produto (form)
/admin/categorias               → CRUD categorias
/admin/pedidos                  → Tabela de pedidos
/admin/promocoes                → CRUD promoções
/admin/fretes                   → Já existe (cidades/bairros)
/admin/configuracoes            → Placeholder
```

### 2.2 Dashboard Overview

**Stats Cards (4):**
1. **Total de Vendas** - Valor total (R$) + % mudança vs período anterior
2. **Total de Pedidos** - Quantidade de pedidos + % mudança
3. **Clientes Ativos** - Quantidade de usuários com pedidos no mês
4. **Estoque Baixo** - Quantidade de produtos com stock < 5

**Gráficos (com Recharts):**
1. **Linha** - Vendas diárias dos últimos 30 dias
   - Eixo X: datas
   - Eixo Y: valor vendido
   
2. **Pizza** - Receita por categoria
   - Cores por categoria
   - Legend
   
3. **Barras Horizontal** - Top 5 produtos mais vendidos
   - Produto vs quantidade vendida
   
4. **Mini Donut** - Status de pedidos
   - Pendente / Confirmado / Entregue / Cancelado

### 2.3 Produtos - CRUD

**Tabela (/admin/produtos):**
- Colunas: [☐] | Imagem (thumbnail) | Nome | Preço | Estoque | Ações
- Filtros acima: Categoria | Faixa de Preço | Status (Ativo/Inativo)
- Busca por nome
- Ordenação clicável nas colunas
- Seleção múltipla com checkbox
- Ações em batch: Deletar selecionados, Inativar selecionados
- Paginação: 10 itens por página
- Botão "Exportar CSV"
- Botão "+ Novo Produto"

**Ações:**
- Clica "Editar" → vai pra `/admin/produtos/:id`
- Clica "Deletar" → confirma → deleta
- Checkbox seleção múltipla → ações em batch

**Novo/Editar Produto (/admin/produtos/novo ou /:id):**
- Formulário em página separada
- Campos:
  - Nome (obrigatório)
  - Descrição (textarea)
  - Categoria (dropdown, obrigatório)
  - Preço (número > 0, obrigatório)
  - Estoque (número >= 0, obrigatório)
  - Ativo (checkbox, padrão true)
  - Imagens (múltiplo, min 1, máx 5)
    - Upload via input file
    - Preview das imagens
    - Botão remover cada uma
- Botões: Cancelar | Salvar
- Validações: Nome único, Preço > 0, min 1 imagem
- Resposta: Toast sucesso + redireciona pra /admin/produtos

### 2.4 Categorias - CRUD

**Tabela (/admin/categorias):**
- Simples: [☐] | Nome | Qtd Produtos | Ações
- Filtro por ativo/inativo
- Paginação básica
- Botão "+ Nova Categoria"

**Criar/Editar:**
- Modal ou página simples
- Campos: Nome, Descrição (optional), Ativo (checkbox)
- Validação: Nome único, obrigatório
- Botões: Cancelar | Salvar

**Ações:**
- Editar → abre form
- Deletar → confirma → deleta (apenas se sem produtos)

### 2.5 Promoções - CRUD

**Tabela (/admin/promocoes):**
- Colunas: [☐] | Nome | Desconto | Válido | Qtd Produtos | Status | Ações
- Filtros: Status (Ativo/Inativo/Expirado)
- Busca por nome
- Paginação
- Botão "+ Nova Promoção"

**Criar/Editar (/admin/promocoes/novo ou /:id):**
- Página separada
- Campos:
  - Nome (obrigatório)
  - Descrição (textarea, optional)
  - Tipo de Desconto: Percentual (%) | Valor Fixo (R$)
  - Valor do Desconto (obrigatório)
  - Válido de: [DATA] (obrigatório)
  - Válido até: [DATA] (obrigatório, > data início)
  - Produtos: Multiselect com lista de produtos
    - Mínimo 1 produto
  - Ativo: Checkbox
- Botões: Cancelar | Salvar
- Validações: Nome obrigatório, data fim > data início, mín 1 produto

**Ações:**
- Editar → abre form
- Deletar → confirma → deleta
- Status automático: "Ativa" se hoje entre datas, "Expirada" se fim < hoje

### 2.6 Pedidos - Visualização + Status

**Tabela (/admin/pedidos):**
- Colunas: ID | Cliente | Total (R$) | Status | Data | Ações
- Filtros: Status (Pendente/Confirmado/Enviado/Entregue/Cancelado)
- Busca por ID ou nome cliente
- Paginação
- Status código de cores:
  - Pendente: Amarelo
  - Confirmado: Azul
  - Enviado: Verde
  - Entregue: Verde escuro
  - Cancelado: Vermelho

**Ações:**
- Clica linha ou "Ver detalhes" → modal com:
  - Dados do pedido (ID, cliente, data)
  - Itens (produto, qtd, preço)
  - Endereço de entrega
  - Mensagem do cartão (se houver)
  - Status atual
  - Histórico de status (com datas)
- Botão "Atualizar Status" → dropdown para novo status
- Novo status salvo → PUT /api/v1/orders/:id
- Resposta: Toast + modal fecha + tabela recarrega

### 2.7 Componentes Frontend

**Novos:**
- `AdminDashboard.tsx` - Página overview
- `AdminSidebar.tsx` - Sidebar com menu
- `AdminHeader.tsx` - Header
- `StatCard.tsx` - Card de estatística
- `DataTable.tsx` - Tabela avançada (reutilizável)
- `ProductForm.tsx` - Formulário de produto
- `CategoryForm.tsx` - Formulário de categoria
- `PromotionForm.tsx` - Formulário de promoção
- `AdminLayout.tsx` - Layout wrapper (sidebar + header + content)

**Charts (Recharts):**
- LineChart, PieChart, BarChart, ComposedChart
- Responsivo, legend, tooltip

---

## 3. BANCO DE DADOS

### 3.1 Novas Tabelas

```prisma
model Promotion {
  id              Int      @id @default(autoincrement())
  name            String
  description     String?  @db.Text
  discountType    String   // "percentage" | "fixed"
  discountValue   Decimal  @db.Decimal(10, 2)
  validFrom       DateTime
  validTo         DateTime
  isActive        Boolean  @default(true)
  products        Product[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Testimonial {
  id          Int     @id @default(autoincrement())
  clientName  String
  rating      Int     // 1-5
  text        String  @db.Text
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model NewsletterSubscription {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  active    Boolean @default(true)
  createdAt DateTime @default(now())
}
```

### 3.2 Alterações em Tabelas Existentes

**Product:**
- Adiciona: `promotions Promotion[]`

**Order:**
- Já tem: `status` (padrão "pending")
- Adiciona: `statusHistory` (opcional, para rastreamento de mudanças)
  - Ou usar campos timestamps: `confirmedAt`, `shippedAt`, `deliveredAt`

---

## 4. API & BACKEND

### 4.1 Endpoints (Novos)

**Produtos:**
```
GET    /api/v1/admin/products?page=1&limit=10&category=&search=&priceMin=&priceMax=&status=
POST   /api/v1/admin/products
GET    /api/v1/admin/products/:id
PUT    /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
POST   /api/v1/admin/products/batch-delete
```

**Categorias:**
```
GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
PUT    /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id
```

**Promoções:**
```
GET    /api/v1/admin/promotions?page=1&limit=10&status=
POST   /api/v1/admin/promotions
PUT    /api/v1/admin/promotions/:id
DELETE /api/v1/admin/promotions/:id
GET    /api/v1/promotions/active (público)
```

**Testimonials:**
```
GET    /api/v1/admin/testimonials
POST   /api/v1/admin/testimonials
PUT    /api/v1/admin/testimonials/:id
DELETE /api/v1/admin/testimonials/:id
GET    /api/v1/testimonials (público)
```

**Newsletter:**
```
POST   /api/v1/newsletter/subscribe
GET    /api/v1/admin/newsletter?page=1&limit=50
```

**Dashboard Stats:**
```
GET    /api/v1/admin/stats
GET    /api/v1/admin/stats/sales-chart?days=30
GET    /api/v1/admin/stats/revenue-by-category
GET    /api/v1/admin/stats/top-products?limit=5
GET    /api/v1/admin/stats/orders-status
```

**Pedidos:**
```
PUT    /api/v1/admin/orders/:id/status
```

### 4.2 Exemplo de Respostas

**GET /api/v1/admin/stats:**
```json
{
  "totalSales": 15420.50,
  "salesChange": 12.5,
  "totalOrders": 142,
  "ordersChange": 8.2,
  "activeCustomers": 87,
  "lowStockProducts": 5
}
```

**GET /api/v1/admin/products:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Rosa Vermelha",
      "price": 45.00,
      "stock": 12,
      "categoryId": 2,
      "categoryName": "Flores Clássicas",
      "isActive": true,
      "images": ["img1.jpg", "img2.jpg"],
      "promotion": {
        "id": 3,
        "name": "Primavera",
        "discountValue": 10,
        "discountType": "percentage"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 47
  }
}
```

**POST /api/v1/newsletter/subscribe:**
```json
Request:  { "email": "cliente@example.com" }
Response: { "id": 5, "email": "cliente@example.com", "createdAt": "2026-04-27T..." }
Error:    { "error": "Email já inscrito", "statusCode": 409 }
```

---

## 5. VALIDAÇÕES & TRATAMENTO DE ERROS

**Frontend:**
- React Hook Form + Zod para validação
- Mensagens de erro inline
- Toast notifications (sucesso/erro)
- Loading states em botões

**Backend:**
- express-validator ou Zod
- Status codes: 400 (validação), 404 (não encontrado), 409 (conflito), 500 (erro)
- Exemplo: `400 { error: "Produto com este nome já existe" }`

**Edge Cases:**
- Deletar categoria com produtos → erro 409
- Deletar promoção ativa → sucesso com aviso
- Email duplicado em newsletter → 409 (ou silent success)
- Upload imagem > 5MB → erro
- Atualizar produto em promoção → permitido
- Promoção expirada ainda é deletável

---

## 6. TESTE & VERIFICAÇÃO

**Home Page:**
- [ ] Categorias carregam e são clicáveis
- [ ] Busca funciona com debounce
- [ ] Promoções mostram desconto correto
- [ ] Newsletter inscreve email novo
- [ ] Newsletter rejeita email duplicado
- [ ] Testimonials carregam (mínimo 1 ativo)

**Dashboard:**
- [ ] Stats cards mostram números corretos
- [ ] Gráficos carregam com dados
- [ ] Tabela de produtos filtra, ordena, seleciona múltiplo
- [ ] CRUD Produto: criar, editar, deletar
- [ ] CRUD Categoria: criar, editar, deletar
- [ ] CRUD Promoção: criar com múltiplos produtos, editar, deletar
- [ ] Atualizar status de pedido reflete na tabela
- [ ] Batch delete funciona

---

## 7. ARQUITETURA & PADRÕES

**Frontend:**
- Componentes reutilizáveis (ProductCard, StatCard, DataTable)
- Custom hooks (usePromotion, useStats, useNewsletter)
- Services para API (adminProductService, adminStatsService, etc)
- Types/Interfaces em arquivos separados
- shadcn/ui + Tailwind para componentes

**Backend:**
- Controllers > Services > Prisma
- Middlewares: authMiddleware, adminMiddleware
- Rotas organizadas por domínio
- Validação no controller
- Tratamento de erro centralizado

**Banco:**
- Migrations Prisma para cada tabela
- Relacionamentos: Promotion ↔ Product (muitos-para-muitos)

---

## 8. DEPENDÊNCIAS NOVAS

**Backend:**
- (nenhuma nova - usa existentes)

**Frontend:**
- `recharts` - gráficos
- (outras já existem)

---

## 9. TIMELINE ESPERADA

Uma sessão com ~20-25 tasks:
- Home Page: 6-8 tasks
- Dashboard Estrutura: 3-4 tasks
- CRUD Produtos: 4-5 tasks
- CRUD Categorias/Promoções: 3-4 tasks
- Gráficos & Stats: 2-3 tasks
- Testes E2E: 2-3 tasks

---

**Versão:** 1.0  
**Data:** 2026-04-27  
**Status:** ✅ Aprovado para implementação
