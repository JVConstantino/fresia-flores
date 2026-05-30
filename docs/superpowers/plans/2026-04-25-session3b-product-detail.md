# Sessão 3B — Página de Detalhe do Produto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a página `/produto/:slug` com galeria de imagens, seletor de variante, campo de mensagem, badges de entrega, abas de detalhes e produtos relacionados — conectada à API real.

**Architecture:** Backend adiciona `findBySlug()` ao productService e parâmetros `limit`/`exclude` ao `findAll()`. Frontend cria `ProductPage.tsx` que busca o produto por slug, carrega relacionados da mesma categoria e reutiliza `ProductCard` e `QuickViewDialog` já existentes.

**Tech Stack:** Express 5, Prisma, React 18, react-router-dom, shadcn (Badge, Button, Textarea), Tailwind, TypeScript.

---

## Mapa de Arquivos

**Backend:**
| Ação | Arquivo |
|------|---------|
| Modificar | `backend/src/services/productService.ts` — adicionar `findBySlug()` + params `limit`/`excludeSlug` em `findAll()` |
| Modificar | `backend/src/controllers/productController.ts` — adicionar `detail()` |
| Modificar | `backend/src/routes/products.ts` — adicionar `GET /:slug` |

**Frontend:**
| Ação | Arquivo |
|------|---------|
| Instalar | shadcn Textarea |
| Modificar | `frontend/src/services/productService.ts` — adicionar `findBySlug()` + params `limit`/`excludeSlug` em `findAll()` |
| Criar | `frontend/src/pages/store/ProductPage.tsx` |
| Modificar | `frontend/src/App.tsx` — adicionar rota `/produto/:slug` |

---

## Task 1: Backend — productService + controller + routes

**Files:**
- Modify: `fresia-claude-setup/fresia/backend/src/services/productService.ts`
- Modify: `fresia-claude-setup/fresia/backend/src/controllers/productController.ts`
- Modify: `fresia-claude-setup/fresia/backend/src/routes/products.ts`

- [ ] **Step 1: Substituir `backend/src/services/productService.ts` na íntegra**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Sort = 'newest' | 'price_asc' | 'price_desc'

export const productService = {
  async findAll(
    categoryId?: number,
    sort: Sort = 'newest',
    limit?: number,
    excludeSlug?: string
  ) {
    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const }
      : sort === 'price_desc' ? { price: 'desc' as const }
      : { createdAt: 'desc' as const }

    return prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(excludeSlug ? { NOT: { slug: excludeSlug } } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { select: { id: true, name: true, price: true, stock: true } },
      },
      orderBy,
      ...(limit ? { take: limit } : {}),
    })
  },

  async findFeatured() {
    return prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  },

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { select: { id: true, name: true, price: true, stock: true } },
      },
    })
  },
}
```

- [ ] **Step 2: Substituir `backend/src/controllers/productController.ts` na íntegra**

```typescript
import { Request, Response, NextFunction } from 'express'
import { productService } from '../services/productService'

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined
      const sort = (req.query.sort as string) || 'newest'
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const excludeSlug = req.query.exclude as string | undefined
      const products = await productService.findAll(categoryId, sort as any, limit, excludeSlug)
      res.json(products)
    } catch (err) {
      next(err)
    }
  },

  async featured(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.findFeatured()
      res.json(products)
    } catch (err) {
      next(err)
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.findBySlug(req.params.slug)
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
      res.json(product)
    } catch (err) {
      next(err)
    }
  },
}
```

- [ ] **Step 3: Substituir `backend/src/routes/products.ts` na íntegra**

```typescript
import { Router } from 'express'
import { productController } from '../controllers/productController'

const router = Router()
router.get('/featured', productController.featured)
router.get('/:slug', productController.detail)
router.get('/', productController.list)
export default router
```

> **Atenção:** A ordem é crítica — `/featured` deve vir antes de `/:slug`, senão "featured" seria interpretado como um slug.

- [ ] **Step 4: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/src/services/productService.ts backend/src/controllers/productController.ts backend/src/routes/products.ts
git commit -m "feat(backend): findBySlug e params limit/exclude em products"
```

---

## Task 2: Backend — Verificar API

- [ ] **Step 1: Reiniciar backend**

Parar qualquer processo na porta 3001 e iniciar:

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsx src/server.ts
```

Esperado: `Backend rodando em http://localhost:3001`

- [ ] **Step 2: Testar GET por slug**

```bash
curl -s http://localhost:3001/api/v1/products/buque-primavera-rosa
```

Esperado: JSON com `id`, `name`, `slug`, `description`, `category`, `variants` (array com 3 itens).

- [ ] **Step 3: Testar /featured ainda funciona**

```bash
curl -s http://localhost:3001/api/v1/products/featured
```

Esperado: array com 3 produtos (não confundido com slug "featured").

- [ ] **Step 4: Testar limit + exclude**

```bash
curl -s "http://localhost:3001/api/v1/products?categoryId=1&limit=4&exclude=buque-primavera-rosa"
```

Esperado: array com 2 produtos (3 buquês - 1 excluído = 2, limitado a 4).

- [ ] **Step 5: Testar 404**

```bash
curl -s http://localhost:3001/api/v1/products/produto-inexistente
```

Esperado: `{"error":"Produto não encontrado"}` com status 404.

---

## Task 3: Frontend — Textarea + productService atualizado

**Files:**
- Install: shadcn Textarea
- Modify: `frontend/src/services/productService.ts`

- [ ] **Step 1: Instalar Textarea do shadcn**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx shadcn@latest add textarea --yes
```

Esperado: `src/components/ui/textarea.tsx` criado.

- [ ] **Step 2: Substituir `frontend/src/services/productService.ts` na íntegra**

```typescript
import { api } from '@/lib/axios'

export interface ProductVariant {
  id: number
  name: string
  price: number
  stock: number
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  images: string
  category: ProductCategory
  variants: ProductVariant[]
}

export interface ProductFeatured {
  id: number
  name: string
  slug: string
  price: number
  images: string
  category: ProductCategory
}

export const productService = {
  async findAll(
    categoryId?: number,
    sort = 'newest',
    limit?: number,
    excludeSlug?: string
  ): Promise<Product[]> {
    const params: Record<string, string | number> = { sort }
    if (categoryId) params.categoryId = categoryId
    if (limit) params.limit = limit
    if (excludeSlug) params.exclude = excludeSlug
    const { data } = await api.get<Product[]>('/products', { params })
    return data
  },

  async findFeatured(): Promise<ProductFeatured[]> {
    const { data } = await api.get<ProductFeatured[]>('/products/featured')
    return data
  },

  async findBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${slug}`)
    return data
  },
}
```

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/ui/textarea.tsx frontend/src/services/productService.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): textarea shadcn e productService com findBySlug"
```

---

## Task 4: Frontend — ProductPage

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/pages/store/ProductPage.tsx`

- [ ] **Step 1: Criar `frontend/src/pages/store/ProductPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { productService, type Product } from '@/services/productService'

type Tab = 'descricao' | 'cuidados' | 'entrega'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

const STATIC_TABS = {
  cuidados:
    'Mantenha em local fresco, troque a água a cada 2 dias e corte os caules em diagonal para maior durabilidade. Evite exposição direta ao sol e fontes de calor.',
  entrega:
    'Entregamos de segunda a sábado. Pedidos feitos até as 14h são entregues no mesmo dia. Consulte disponibilidade para sua região durante o checkout.',
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [activeThumb, setActiveThumb] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('descricao')
  const [message, setMessage] = useState('')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    productService
      .findBySlug(slug)
      .then(p => {
        setProduct(p)
        setSelectedVariantId(p.variants[0]?.id ?? null)
        return productService.findAll(p.category.id, 'newest', 4, slug)
      })
      .then(setRelated)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-7 py-16">
          <div className="grid grid-cols-2 gap-16">
            <div className="animate-pulse bg-ink-100 rounded-lg aspect-[4/5]" />
            <div className="space-y-4 pt-4">
              <div className="animate-pulse bg-ink-100 rounded h-5 w-20" />
              <div className="animate-pulse bg-ink-100 rounded h-10 w-3/4" />
              <div className="animate-pulse bg-ink-100 rounded h-24 w-full" />
              <div className="animate-pulse bg-ink-100 rounded h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (notFound || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-7 py-24 text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="font-display italic text-3xl text-ink-800 mb-2">
            Produto não encontrado
          </h1>
          <p className="text-ink-500 mb-6">Este produto não existe ou foi removido.</p>
          <a href="/loja" className="text-sm text-lilac-500 hover:text-lilac-600 underline">
            Voltar à loja
          </a>
        </div>
      </Layout>
    )
  }

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId)
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price)
  const thumbCount = Math.max(
    (() => { try { return JSON.parse(product.images).length } catch { return 0 } })(),
    1
  )

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ink-500 mb-8">
          <a href="/" className="hover:text-ink-800 transition-colors">Início</a>
          <span>/</span>
          <a href="/loja" className="hover:text-ink-800 transition-colors">Loja</a>
          <span>/</span>
          <a
            href={`/loja?categoria=${product.category.slug}`}
            className="hover:text-ink-800 transition-colors"
          >
            {product.category.name}
          </a>
          <span>/</span>
          <span className="text-ink-800 font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Área principal */}
        <div className="grid grid-cols-[1.1fr_1fr] gap-16 mb-20">
          {/* Galeria */}
          <div className="grid grid-cols-[70px_1fr] gap-4">
            <div className="flex flex-col gap-3">
              {Array.from({ length: thumbCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  className={`aspect-square rounded-md border overflow-hidden bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center text-xl transition-all ${
                    activeThumb === i
                      ? 'border-ink-800 ring-2 ring-ink-800'
                      : 'border-ink-200 hover:border-ink-400'
                  }`}
                >
                  🌸
                </button>
              ))}
            </div>
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center">
              <span className="text-[100px]">🌸</span>
            </div>
          </div>

          {/* Info */}
          <div>
            <Badge
              variant="outline"
              className="text-lilac-500 border-lilac-200 text-[10px] mb-4 cursor-pointer hover:bg-lilac-50"
              onClick={() =>
                (window.location.href = `/loja?categoria=${product.category.slug}`)
              }
            >
              {product.category.name}
            </Badge>

            <h1 className="font-display italic text-4xl text-ink-800 leading-tight mb-4">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-sm text-ink-500 leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Variantes */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
                  Tamanho
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2 text-xs rounded-pill border transition-colors ${
                        selectedVariantId === variant.id
                          ? 'border-ink-800 text-ink-800 font-semibold'
                          : 'border-ink-200 text-ink-500 hover:border-lilac-500 hover:text-lilac-500'
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preço */}
            <div className="font-display italic text-4xl text-ink-800 mb-6">
              {formatPrice(displayPrice)}
            </div>

            {/* Mensagem para o cartão */}
            <div className="mb-6">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
                Mensagem para o cartão{' '}
                <span className="normal-case font-normal">(opcional)</span>
              </div>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 120))}
                placeholder="Ex: Feliz aniversário, com carinho..."
                className="text-sm resize-none h-20"
              />
              <div className="text-[10px] text-ink-500 text-right mt-1">
                {message.length}/120
              </div>
            </div>

            {/* Badges de entrega */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { icon: '🚚', label: 'Entrega em até 24h' },
                { icon: '🏪', label: 'Retirada disponível' },
                { icon: '🌿', label: 'Flores frescas garantidas' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-ink-600 border border-ink-200 rounded-pill px-3 py-1.5"
                >
                  {icon} {label}
                </span>
              ))}
            </div>

            {/* Botão */}
            <Button className="bg-ink-800 hover:bg-lilac-500 text-white w-full py-3 rounded-pill text-sm font-semibold transition-colors">
              Adicionar ao carrinho
            </Button>
          </div>
        </div>

        {/* Abas de detalhes */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="flex border-b border-ink-200 mb-6">
            {(['descricao', 'cuidados', 'entrega'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? 'text-ink-800' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {tab === 'descricao'
                  ? 'Descrição'
                  : tab === 'cuidados'
                  ? 'Cuidados'
                  : 'Entrega'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-800 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">
            {activeTab === 'descricao'
              ? product.description ?? 'Sem descrição disponível.'
              : activeTab === 'cuidados'
              ? STATIC_TABS.cuidados
              : STATIC_TABS.entrega}
          </p>
        </div>

        {/* Produtos relacionados */}
        {related.length > 0 && (
          <div>
            <h2 className="font-display italic text-3xl text-ink-800 mb-6">
              Você também pode <em className="text-lilac-500 not-italic font-normal">gostar</em>
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </Layout>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/pages/store/ProductPage.tsx
git commit -m "feat(frontend): ProductPage com galeria, variantes, mensagem e relacionados"
```

---

## Task 5: Frontend — App.tsx + rota produto

**Files:**
- Modify: `fresia-claude-setup/fresia/frontend/src/App.tsx`

- [ ] **Step 1: Substituir `frontend/src/App.tsx` na íntegra**

```tsx
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { StorePage } from '@/pages/store/StorePage'
import { ProductPage } from '@/pages/store/ProductPage'

function HomePage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-24 text-center">
        <h1 className="font-display italic text-5xl text-lilac-500 mb-3">Frésia Flores</h1>
        <p className="text-ink-500 mb-8">Flores com alma, entregues com carinho.</p>
        <a
          href="/loja"
          className="inline-block bg-ink-800 hover:bg-lilac-500 text-white text-sm font-medium px-6 py-3 rounded-pill transition-colors"
        >
          Ver nossa loja
        </a>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/loja" element={<StorePage />} />
      <Route path="/produto/:slug" element={<ProductPage />} />
    </Routes>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/App.tsx
git commit -m "feat(frontend): rota /produto/:slug adicionada"
```

---

## Task 6: Verificação e2e

- [ ] **Step 1: Garantir backend e frontend rodando**

Backend: `http://localhost:3001/api/v1/health` → `{"status":"ok"}`
Frontend: `http://localhost:5173` → homepage carrega

- [ ] **Step 2: Acessar página de produto diretamente**

Abrir: `http://localhost:5173/produto/buque-primavera-rosa`

Esperado:
- Breadcrumb: Início / Loja / Buquês / Buquê Primavera Rosa
- Galeria com thumbnail + imagem principal
- Pills de variante: Pequeno (selecionado), Médio, Grande
- Preço muda ao trocar variante
- Textarea de mensagem com contador 0/120

- [ ] **Step 3: Testar abas**

Clicar em "Cuidados" → texto de cuidados aparece.
Clicar em "Entrega" → texto de entrega aparece.
Clicar em "Descrição" → descrição do produto.

- [ ] **Step 4: Testar relacionados**

Rolar até o final → "Você também pode gostar" com até 3 cards (outros buquês).
Hover em card → overlay "Ver rápido" aparece.
Clicar → QuickViewDialog abre.

- [ ] **Step 5: Testar navegação da loja → produto**

Abrir `http://localhost:5173/loja`.
Hover em card → clicar "Ver rápido" → Dialog abre → clicar "Ver produto completo" → navega para `/produto/:slug`.

- [ ] **Step 6: Testar 404**

Abrir `http://localhost:5173/produto/produto-que-nao-existe`.
Esperado: tela "Produto não encontrado" com link "Voltar à loja".

- [ ] **Step 7: Commit final**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add -A
git commit -m "chore: verificacao e2e session 3b concluida"
```

---

## Self-Review

- [x] **Spec coverage:** backend (Task 1), API verify (Task 2), Textarea + frontend service (Task 3), ProductPage (Task 4), App.tsx rota (Task 5), e2e (Task 6)
- [x] **Sem placeholders:** todo o código está completo em cada step
- [x] **Consistência de tipos:** `Product` com `variants: ProductVariant[]` definido na Task 3 e usado corretamente na Task 4. `findBySlug(slug)` retorna `Promise<Product>` — ProductPage usa try/catch para capturar 404
- [x] **Ordem das rotas:** `/featured` antes de `/:slug` no router — sem conflito
- [x] **thumbCount:** usa try/catch inline para parse seguro de `product.images` (string JSON no banco)
- [x] **`activeThumb`:** estado presente mas só controla estilo visual (placeholder sem imagens reais ainda)
- [x] **Mensagem 120 chars:** `slice(0, 120)` no onChange, contador `{message.length}/120` no UI
