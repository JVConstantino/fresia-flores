# Design: Sessão 3A — Catálogo (Listagem de Produtos)

**Data:** 2026-04-24
**Status:** Aprovado

---

## Objetivo

Entregar a página de loja funcional com dados reais do banco: backend API de produtos e categorias, seed com 4 categorias e 12 produtos, página de listagem com sidebar de filtro, cards com variantes e quick view, e mega menu de categorias no header.

---

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Layout da loja | Sidebar (categorias) + grid 4 colunas | Mais poderoso, fiel ao protótipo |
| Card de produto | Pills de variante + overlay "Ver rápido" ao hover | Visual rico sem poluir |
| Header categorias | Mega menu (categorias + 3 destaques) | Tom boutique premium |
| Filtros sidebar | Só categorias (checkboxes) | MVP — preço depois |
| Dados | Seed real no banco | Sem mocks hardcoded |
| Estado | useState + useEffect local | Sem cache por ora |

---

## Arquitetura

```
Backend (Express + Prisma)              Frontend (React)
──────────────────────────              ────────────────
GET /api/v1/categories              →   Header mega menu + sidebar
GET /api/v1/products?categoryId=N   →   StorePage (listagem filtrada)
GET /api/v1/products/featured       →   Mega menu destaques (3 itens)
```

Chamadas via axios em `services/`. Estado local com `useState`/`useEffect`.

---

## Backend

### Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `backend/src/routes/categories.ts` | Rotas de categorias |
| Criar | `backend/src/routes/products.ts` | Rotas de produtos |
| Criar | `backend/src/controllers/categoryController.ts` | Request/response categorias |
| Criar | `backend/src/controllers/productController.ts` | Request/response produtos |
| Criar | `backend/src/services/categoryService.ts` | Lógica de negócio categorias |
| Criar | `backend/src/services/productService.ts` | Lógica de negócio produtos |
| Criar | `backend/prisma/seed.ts` | 4 categorias + 12 produtos + variantes |
| Modificar | `backend/src/server.ts` | Registrar rotas /categories e /products |

### Rotas

```
GET /api/v1/categories
  → [{ id, name, slug, _count: { products } }]

GET /api/v1/products?categoryId=N&sort=newest|price_asc|price_desc
  → [{ id, name, slug, price, images, category, variants }]

GET /api/v1/products/featured
  → [{ id, name, slug, price, images, category }]  (3 itens, isActive=true)
```

### Payload produto (listagem)

```json
{
  "id": 1,
  "name": "Buquê Primavera Rosa",
  "slug": "buque-primavera-rosa",
  "price": 89.00,
  "images": "[\"/placeholder.jpg\"]",
  "category": { "id": 1, "name": "Buquês", "slug": "buques" },
  "variants": [
    { "id": 1, "name": "Pequeno", "price": 89.00, "stock": 10 },
    { "id": 2, "name": "Médio",   "price": 119.00, "stock": 8 },
    { "id": 3, "name": "Grande",  "price": 159.00, "stock": 5 }
  ]
}
```

### Seed

```
Categorias (4):
  Buquês    (slug: buques)
  Arranjos  (slug: arranjos)
  Plantas   (slug: plantas)
  Presentes (slug: presentes)

Produtos (12 — 3 por categoria):
  Buquês:    Buquê Primavera Rosa, Buquê Amor Eterno, Buquê Silvestre
  Arranjos:  Arranjo Tropical, Arranjo Mesa Elegante, Arranjo Campestre
  Plantas:   Suculenta Trio, Orquídea Branca, Ficus Lyrata
  Presentes: Kit Romântico, Cesta Floral, Box Especial

Variantes (1-3 por produto, preços escalonados)
```

---

## Frontend

### Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `frontend/src/services/categoryService.ts` | axios GET /categories |
| Criar | `frontend/src/services/productService.ts` | axios GET /products + /featured |
| Criar | `frontend/src/lib/axios.ts` | instância axios com baseURL /api/v1 |
| Criar | `frontend/src/pages/store/StorePage.tsx` | Página de loja completa |
| Criar | `frontend/src/components/features/ProductCard.tsx` | Card com pills + overlay |
| Criar | `frontend/src/components/features/QuickViewDialog.tsx` | Dialog quick view |
| Modificar | `frontend/src/components/layout/Header.tsx` | Adicionar mega menu |
| Modificar | `frontend/src/main.tsx` | BrowserRouter + Routes |
| Modificar | `frontend/src/App.tsx` | Definir rotas (/  e /loja) |

### StorePage.tsx

```
Layout
  div.max-w-7xl (padding, margin auto)
    store header: título + contagem + select sort
    div.grid [280px | 1fr] gap-8
      Sidebar sticky:
        h4 "Categorias"
        categories.map → checkbox + label + contagem
        [Limpar filtros] se filtro ativo
      main:
        ProductGrid: products.map → <ProductCard />
        estado vazio: ilustração + mensagem se products.length === 0
```

### ProductCard.tsx

```tsx
props: { product: ProductListItem, onQuickView: (product) => void }

<div className="card group relative">
  <div className="relative overflow-hidden">
    <img />  // placeholder se sem imagem
    // Overlay hover (opacity-0 group-hover:opacity-100)
    <div onClick={() => onQuickView(product)}>
      <button>"Ver rápido"</button>
    </div>
  </div>
  <div className="card-body">
    categoria / nome
    // Pills de variante (useState para variante selecionada)
    variants.map → <button pill, on=selectedVariant>
    // Preço baseado na variante selecionada (ou mínimo se nenhuma)
    <span>a partir de R$ {minPrice}</span>
    <button "+">  // abre QuickViewDialog
  </div>
</div>
```

### QuickViewDialog.tsx

```
Dialog shadcn, max-w-2xl
  DialogContent
    grid 2 colunas [imagem | info]
    Esquerda: imagem do produto (placeholder)
    Direita:
      badge categoria
      h2 nome produto
      p descrição (primeiros 120 chars)
      pills de variante (useState)
      preço da variante selecionada
      Button "Adicionar ao carrinho" (placeholder — funcional na Sessão 4)
      Button outline "Ver produto completo" → /produto/:slug
```

### Header mega menu

```tsx
// Estado: isMenuOpen (boolean), categories[], featured[]
// useEffect no mount: fetch /categories + /products/featured
// Click em "Categorias": toggle isMenuOpen
// Click fora (useRef + mousedown): fecha menu

// Painel:
div absolute (top: 100%, left: 0, right: 0) z-50
  grid [200px | 1fr]
  Esquerda: lista de categorias clicáveis → navigate('/loja?categoria=slug')
  Direita: grid 3 colunas com cards compactos dos destaques
```

### Roteamento (main.tsx + App.tsx)

```tsx
// main.tsx: envolve App em <BrowserRouter>
// App.tsx:
<Routes>
  <Route path="/" element={<Layout><HomePage /></Layout>} />
  <Route path="/loja" element={<StorePage />} />
</Routes>
// HomePage: placeholder simples (título + link para loja)
```

---

## Critérios de Sucesso

1. `GET /api/v1/categories` retorna 4 categorias com contagem
2. `GET /api/v1/products` retorna 12 produtos com variantes
3. `localhost:5173/loja` exibe grid com 12 cards
4. Filtro por categoria na sidebar atualiza a listagem
5. Hover no card revela overlay "Ver rápido"
6. Click em "Ver rápido" abre Dialog com detalhes do produto
7. Click em "Categorias" no header abre mega menu com categorias e destaques

---

## Fora do Escopo desta Sessão

- Página de detalhe do produto `/produto/:slug` (Sessão 3B)
- Adicionar ao carrinho com itens reais (Sessão 4)
- Filtro de preço na sidebar (pós-MVP)
- Paginação (pós-MVP)
- Busca (pós-MVP)
