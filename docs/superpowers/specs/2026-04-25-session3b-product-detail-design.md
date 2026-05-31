# Design: Sessão 3B — Página de Detalhe do Produto

**Data:** 2026-04-25
**Status:** Aprovado

---

## Objetivo

Criar a página de detalhe do produto em `/produto/:slug` com galeria de imagens, seletor de variante, campo de mensagem para o cartão, badges de entrega, abas de detalhes e produtos relacionados — conectada à API real.

---

## Decisões

| Decisão | Escolha |
|---------|---------|
| Layout galeria | Opção A: thumbnails verticais à esquerda + imagem principal (protótipo) |
| Info coluna | Essencial + badges de entrega + textarea de mensagem para cartão |
| Seções abaixo | Abas (Descrição / Cuidados / Entrega) + Produtos relacionados (grid 4) |
| Estado abas | useState local, sem biblioteca externa |
| Relacionados | Mesma categoria, exclui produto atual, máx 4 — reutiliza `GET /products` com params novos |

---

## Backend

### Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `backend/src/services/productService.ts` — adicionar `findBySlug()` e params `limit`/`exclude` em `findAll()` |
| Modificar | `backend/src/controllers/productController.ts` — adicionar `detail()` handler |
| Modificar | `backend/src/routes/products.ts` — adicionar `GET /:slug` |

### Novas rotas

```
GET /api/v1/products/:slug
  → produto completo: id, name, slug, description, price, images, stock,
    category { id, name, slug }, variants [{ id, name, price, stock }]

GET /api/v1/products?categoryId=N&limit=4&exclude=slug-atual
  → reutiliza findAll() com parâmetros opcionais novos
```

### Mudanças em `findAll()`

```typescript
// Adicionar parâmetros opcionais:
findAll(categoryId?: number, sort?: Sort, limit?: number, excludeSlug?: string)

// Adicionar ao where:
...(excludeSlug ? { NOT: { slug: excludeSlug } } : {})

// Adicionar take:
take: limit ?? undefined
```

### `findBySlug()`

```typescript
async findBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: { select: { id: true, name: true, price: true, stock: true } },
    },
  })
}
```

### productController — `detail()`

```typescript
async detail(req, res, next) {
  const product = await productService.findBySlug(req.params.slug)
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
  res.json(product)
}
```

### products router — ordem importa

```typescript
router.get('/featured', productController.featured)
router.get('/:slug', productController.detail)   // ← novo, depois de /featured
router.get('/', productController.list)
```

---

## Frontend

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `frontend/src/pages/store/ProductPage.tsx` |
| Instalar | `shadcn Textarea` — `npx shadcn@latest add textarea` |
| Modificar | `frontend/src/services/productService.ts` — adicionar `findBySlug()` e params `limit`/`exclude` em `findAll()` |
| Modificar | `frontend/src/App.tsx` — adicionar rota `/produto/:slug` |

### ProductPage.tsx — estrutura completa

```
<Layout>
  <div max-w-7xl>
    Breadcrumb: Início / Loja / {categoria} / {nome}

    <div grid [1.1fr | 1fr] gap-16>
      /* Galeria */
      <div grid [70px | 1fr]>
        Thumbnails verticais (clicáveis, border ativo ink-800)
        Imagem principal aspect-ratio 4/5, rounded-lg
        (placeholder gradient se sem imagem)

      /* Info */
      <div>
        <Badge> categoria → link /loja?categoria=slug
        <h1> nome Fraunces italic
        <p> descrição completa
        Seletor variante (pills, useState selectedVariantId)
        Preço da variante selecionada (Fraunces italic grande)
        ---
        <Textarea> "Mensagem para o cartão" (opcional, maxLength 120)
          placeholder: "Ex: Feliz aniversário, com carinho..."
        ---
        Badges de entrega (3 chips outline):
          🚚 Entrega em até 24h
          🏪 Retirada disponível
          🌿 Flores frescas garantidas
        ---
        <Button> "Adicionar ao carrinho" ink-800 full-width pill (placeholder)
    </div>

    /* Abas */
    <div max-w-3xl mx-auto mt-16>
      Tabs: [Descrição] [Cuidados] [Entrega]
      Descrição: product.description
      Cuidados: "Mantenha em local fresco, troque a água a cada 2 dias,
               corte os caules em diagonal para maior durabilidade."
      Entrega: "Entregamos de segunda a sábado. Pedidos feitos até as 14h
              são entregues no mesmo dia. Consulte sua região."

    /* Relacionados */
    <div mt-16>
      <h2> "Você também pode gostar"
      <div grid grid-cols-4>
        {related.map → <ProductCard onQuickView={setQuickViewProduct} />}
      <QuickViewDialog />
```

### productService.ts — mudanças frontend

```typescript
// Adicionar ao findAll():
async findAll(categoryId?: number, sort = 'newest', limit?: number, excludeSlug?: string)
// Adicionar aos params: if (limit) params.limit = limit; if (excludeSlug) params.exclude = excludeSlug

// Novo método (axios lança em 404 — capturar no componente):
async findBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${slug}`)
  return data
}
// ProductPage usa try/catch: se erro → mostrar estado "Produto não encontrado"
```

### App.tsx — rota adicional

```tsx
import { ProductPage } from '@/pages/store/ProductPage'
// Dentro de <Routes>:
<Route path="/produto/:slug" element={<ProductPage />} />
```

---

## Critérios de Sucesso

1. `GET /api/v1/products/buque-primavera-rosa` retorna produto com variantes
2. `GET /api/v1/products?categoryId=1&limit=4&exclude=buque-primavera-rosa` retorna 3 produtos
3. `/produto/buque-primavera-rosa` carrega a página com galeria e info
4. Seletor de variante atualiza o preço
5. Textarea de mensagem aceita até 120 chars
6. Abas alternam corretamente entre Descrição / Cuidados / Entrega
7. Grid de relacionados exibe até 4 cards clicáveis com quick view
8. Breadcrumb navega corretamente

---

## Fora do Escopo

- Adicionar ao carrinho com dados reais (Sessão 4)
- Upload/gestão de imagens reais (pós-MVP)
- Rating/reviews (pós-MVP)
- Compartilhar produto
