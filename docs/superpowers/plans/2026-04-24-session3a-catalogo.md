# Sessão 3A — Catálogo: Backend + Listagem de Produtos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a página de loja funcional com dados reais: API de produtos e categorias, seed com 12 produtos, listagem com sidebar, cards com variantes e quick view, e mega menu no header.

**Architecture:** Backend Express+Prisma expõe `/api/v1/categories`, `/api/v1/products` e `/api/v1/products/featured`. Frontend React consome via axios, renderiza StorePage com sidebar de filtro de categorias e grid de ProductCards. Header atualizado com mega menu dinâmico. QuickViewDialog exibe detalhe sem sair da página.

**Tech Stack:** Express 5, Prisma, MariaDB (XAMPP), React 18, axios, react-router-dom, Tailwind, shadcn Dialog/Badge/Button.

---

## Mapa de Arquivos

**Backend:**
| Ação | Arquivo |
|------|---------|
| Criar | `backend/src/services/categoryService.ts` |
| Criar | `backend/src/services/productService.ts` |
| Criar | `backend/src/controllers/categoryController.ts` |
| Criar | `backend/src/controllers/productController.ts` |
| Criar | `backend/src/routes/categories.ts` |
| Criar | `backend/src/routes/products.ts` |
| Criar | `backend/prisma/seed.ts` |
| Modificar | `backend/package.json` (script seed) |
| Modificar | `backend/src/server.ts` (registrar rotas) |

**Frontend:**
| Ação | Arquivo |
|------|---------|
| Criar | `frontend/src/lib/axios.ts` |
| Criar | `frontend/src/services/categoryService.ts` |
| Criar | `frontend/src/services/productService.ts` |
| Modificar | `frontend/src/main.tsx` (BrowserRouter) |
| Modificar | `frontend/src/App.tsx` (Routes) |
| Criar | `frontend/src/components/features/ProductCard.tsx` |
| Criar | `frontend/src/components/features/QuickViewDialog.tsx` |
| Criar | `frontend/src/pages/store/StorePage.tsx` |
| Modificar | `frontend/src/components/layout/Header.tsx` (mega menu) |

---

## Task 1: Backend — Services

**Files:**
- Create: `fresia-claude-setup/fresia/backend/src/services/categoryService.ts`
- Create: `fresia-claude-setup/fresia/backend/src/services/productService.ts`

- [ ] **Step 1: Criar `backend/src/services/categoryService.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const categoryService = {
  async findAll() {
    return prisma.category.findMany({
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    })
  },
}
```

- [ ] **Step 2: Criar `backend/src/services/productService.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Sort = 'newest' | 'price_asc' | 'price_desc'

export const productService = {
  async findAll(categoryId?: number, sort: Sort = 'newest') {
    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const }
      : sort === 'price_desc' ? { price: 'desc' as const }
      : { createdAt: 'desc' as const }

    return prisma.product.findMany({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { select: { id: true, name: true, price: true, stock: true } },
      },
      orderBy,
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
}
```

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsc --noEmit
```

Esperado: sem erros.

---

## Task 2: Backend — Controllers + Routes + Server

**Files:**
- Create: `backend/src/controllers/categoryController.ts`
- Create: `backend/src/controllers/productController.ts`
- Create: `backend/src/routes/categories.ts`
- Create: `backend/src/routes/products.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Criar `backend/src/controllers/categoryController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { categoryService } from '../services/categoryService'

export const categoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.findAll()
      res.json(categories)
    } catch (err) {
      next(err)
    }
  },
}
```

- [ ] **Step 2: Criar `backend/src/controllers/productController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { productService } from '../services/productService'

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined
      const sort = (req.query.sort as string) || 'newest'
      const products = await productService.findAll(categoryId, sort as any)
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
}
```

- [ ] **Step 3: Criar `backend/src/routes/categories.ts`**

```typescript
import { Router } from 'express'
import { categoryController } from '../controllers/categoryController'

const router = Router()
router.get('/', categoryController.list)
export default router
```

- [ ] **Step 4: Criar `backend/src/routes/products.ts`**

```typescript
import { Router } from 'express'
import { productController } from '../controllers/productController'

const router = Router()
router.get('/featured', productController.featured)
router.get('/', productController.list)
export default router
```

- [ ] **Step 5: Atualizar `backend/src/server.ts`**

Ler o arquivo atual e adicionar as importações e registros de rota. O arquivo completo deve ficar:

```typescript
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'
import categoriesRouter from './routes/categories'
import productsRouter from './routes/products'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() })
})

app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/products', productsRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
```

- [ ] **Step 6: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/src/
git commit -m "feat(backend): rotas categories e products com services"
```

---

## Task 3: Backend — Seed

**Files:**
- Create: `backend/prisma/seed.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Criar `backend/prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpar dados existentes (ordem: dependentes primeiro)
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // Categorias
  const buques    = await prisma.category.create({ data: { name: 'Buquês',    slug: 'buques'    } })
  const arranjos  = await prisma.category.create({ data: { name: 'Arranjos',  slug: 'arranjos'  } })
  const plantas   = await prisma.category.create({ data: { name: 'Plantas',   slug: 'plantas'   } })
  const presentes = await prisma.category.create({ data: { name: 'Presentes', slug: 'presentes' } })

  const products = [
    // Buquês
    {
      name: 'Buquê Primavera Rosa', slug: 'buque-primavera-rosa', categoryId: buques.id,
      description: 'Um buquê fresco e delicado, perfeito para presentear em qualquer ocasião especial.',
      price: 89, stock: 23,
      variants: [
        { name: 'Pequeno', price: 89,  stock: 10 },
        { name: 'Médio',   price: 119, stock: 8  },
        { name: 'Grande',  price: 159, stock: 5  },
      ],
    },
    {
      name: 'Buquê Amor Eterno', slug: 'buque-amor-eterno', categoryId: buques.id,
      description: 'Rosas vermelhas selecionadas, símbolo do amor verdadeiro e eterno.',
      price: 129, stock: 13,
      variants: [
        { name: '12 Rosas', price: 129, stock: 8 },
        { name: '24 Rosas', price: 219, stock: 5 },
      ],
    },
    {
      name: 'Buquê Silvestre', slug: 'buque-silvestre', categoryId: buques.id,
      description: 'Flores silvestres coloridas para um toque natural e espontâneo.',
      price: 75, stock: 18,
      variants: [
        { name: 'Pequeno', price: 75,  stock: 12 },
        { name: 'Grande',  price: 115, stock: 6  },
      ],
    },
    // Arranjos
    {
      name: 'Arranjo Tropical', slug: 'arranjo-tropical', categoryId: arranjos.id,
      description: 'Flores exóticas e tropicais que trazem alegria e cor a qualquer ambiente.',
      price: 120, stock: 11,
      variants: [
        { name: 'Mesa',   price: 120, stock: 7 },
        { name: 'Grande', price: 185, stock: 4 },
      ],
    },
    {
      name: 'Arranjo Mesa Elegante', slug: 'arranjo-mesa-elegante', categoryId: arranjos.id,
      description: 'Arranjo sofisticado para decorar mesas de jantar e eventos especiais.',
      price: 145, stock: 12,
      variants: [
        { name: 'Compacto', price: 145, stock: 6 },
        { name: 'Padrão',   price: 195, stock: 4 },
        { name: 'Premium',  price: 265, stock: 2 },
      ],
    },
    {
      name: 'Arranjo Campestre', slug: 'arranjo-campestre', categoryId: arranjos.id,
      description: 'Charme e simplicidade do campo reunidos em um arranjo encantador.',
      price: 95, stock: 9,
      variants: [{ name: 'Único', price: 95, stock: 9 }],
    },
    // Plantas
    {
      name: 'Suculenta Trio', slug: 'suculenta-trio', categoryId: plantas.id,
      description: 'Conjunto de três suculentas cuidadosamente selecionadas, baixa manutenção.',
      price: 55, stock: 25,
      variants: [
        { name: 'Pequeno', price: 55, stock: 15 },
        { name: 'Médio',   price: 85, stock: 10 },
      ],
    },
    {
      name: 'Orquídea Branca', slug: 'orquidea-branca', categoryId: plantas.id,
      description: 'Orquídea Phalaenopsis branca, elegante e duradoura, ideal para presentear.',
      price: 89, stock: 13,
      variants: [
        { name: '1 Haste', price: 89,  stock: 8 },
        { name: '2 Hastes', price: 149, stock: 5 },
      ],
    },
    {
      name: 'Ficus Lyrata', slug: 'ficus-lyrata', categoryId: plantas.id,
      description: 'A planta queridinha da decoração, com folhas grandes e marcantes.',
      price: 120, stock: 12,
      variants: [
        { name: 'P (30cm)', price: 120, stock: 6 },
        { name: 'M (60cm)', price: 185, stock: 4 },
        { name: 'G (90cm)', price: 265, stock: 2 },
      ],
    },
    // Presentes
    {
      name: 'Kit Romântico', slug: 'kit-romantico', categoryId: presentes.id,
      description: 'Buquê de rosas, chocolates finos e cartão personalizado para surpreender.',
      price: 185, stock: 12,
      variants: [
        { name: 'Padrão',  price: 185, stock: 8 },
        { name: 'Premium', price: 265, stock: 4 },
      ],
    },
    {
      name: 'Cesta Floral', slug: 'cesta-floral', categoryId: presentes.id,
      description: 'Cesta artesanal com flores frescas, ideal para comemorações especiais.',
      price: 145, stock: 9,
      variants: [
        { name: 'Pequena', price: 145, stock: 6 },
        { name: 'Grande',  price: 215, stock: 3 },
      ],
    },
    {
      name: 'Box Especial', slug: 'box-especial', categoryId: presentes.id,
      description: 'Box exclusiva com flores, vela aromática e mensagem personalizada.',
      price: 225, stock: 5,
      variants: [{ name: 'Único', price: 225, stock: 5 }],
    },
  ]

  for (const { variants, ...product } of products) {
    const created = await prisma.product.create({
      data: { ...product, images: JSON.stringify([]) },
    })
    await prisma.productVariant.createMany({
      data: variants.map(v => ({ ...v, productId: created.id })),
    })
  }

  console.log('Seed concluido: 4 categorias, 12 produtos.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Adicionar script seed ao `backend/package.json`**

Abrir `backend/package.json` e adicionar dentro de `"scripts"`:
```json
"seed": "tsx prisma/seed.ts"
```

O bloco scripts completo fica:
```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Rodar o seed**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npm run seed
```

Esperado: `Seed concluido: 4 categorias, 12 produtos.`

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/prisma/seed.ts backend/package.json
git commit -m "feat(backend): seed com 4 categorias e 12 produtos"
```

---

## Task 4: Backend — Verificar API

- [ ] **Step 1: Reiniciar backend**

Parar qualquer processo na porta 3001 e iniciar novamente:

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsx src/server.ts
```

Esperado: `Backend rodando em http://localhost:3001`

- [ ] **Step 2: Testar `/categories`**

Em outro terminal:
```bash
curl -s http://localhost:3001/api/v1/categories
```

Esperado: array com 4 categorias, cada uma com `_count.products > 0`.

- [ ] **Step 3: Testar `/products`**

```bash
curl -s http://localhost:3001/api/v1/products | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} produtos')"
```

Esperado: `12 produtos`

- [ ] **Step 4: Testar `/products/featured`**

```bash
curl -s http://localhost:3001/api/v1/products/featured
```

Esperado: array com 3 produtos, cada um com `category` aninhado.

- [ ] **Step 5: Testar filtro por categoria**

```bash
curl -s "http://localhost:3001/api/v1/products?categoryId=1"
```

Esperado: array com 3 produtos da categoria 1 (Buquês).

---

## Task 5: Frontend — Axios + Services + Router

**Files:**
- Create: `frontend/src/lib/axios.ts`
- Create: `frontend/src/services/categoryService.ts`
- Create: `frontend/src/services/productService.ts`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Instalar axios**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npm install axios
```

Esperado: axios adicionado ao package.json.

- [ ] **Step 2: Criar `frontend/src/lib/axios.ts`**

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})
```

- [ ] **Step 3: Criar `frontend/src/services/categoryService.ts`**

```typescript
import { api } from '@/lib/axios'

export interface Category {
  id: number
  name: string
  slug: string
  _count: { products: number }
}

export const categoryService = {
  async findAll(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories')
    return data
  },
}
```

- [ ] **Step 4: Criar `frontend/src/services/productService.ts`**

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
  async findAll(categoryId?: number, sort = 'newest'): Promise<Product[]> {
    const params: Record<string, string | number> = { sort }
    if (categoryId) params.categoryId = categoryId
    const { data } = await api.get<Product[]>('/products', { params })
    return data
  },

  async findFeatured(): Promise<ProductFeatured[]> {
    const { data } = await api.get<ProductFeatured[]>('/products/featured')
    return data
  },
}
```

- [ ] **Step 5: Atualizar `frontend/src/main.tsx` — adicionar BrowserRouter**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 6: Atualizar `frontend/src/App.tsx` — adicionar Routes**

```tsx
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { StorePage } from '@/pages/store/StorePage'

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
    </Routes>
  )
}
```

- [ ] **Step 7: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: erros de `StorePage` não encontrado são esperados (ainda não criado). Nenhum outro erro.

- [ ] **Step 8: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/lib/ frontend/src/services/ frontend/src/main.tsx frontend/src/App.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): axios, services, router"
```

---

## Task 6: Frontend — ProductCard e QuickViewDialog

**Files:**
- Create: `frontend/src/components/features/ProductCard.tsx`
- Create: `frontend/src/components/features/QuickViewDialog.tsx`

- [ ] **Step 1: Criar `frontend/src/components/features/ProductCard.tsx`**

```tsx
import { useState } from 'react'
import { type Product } from '@/services/productService'

interface ProductCardProps {
  product: Product
  onQuickView: (product: Product) => void
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product.variants[0]?.id ?? null
  )

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId)
  const minPrice = Math.min(...product.variants.map(v => Number(v.price)), Number(product.price))
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : minPrice
  const showFromLabel = product.variants.length > 1 && selectedVariant?.id === product.variants[0]?.id

  return (
    <div className="bg-white border border-ink-200 rounded-lg overflow-hidden group">
      {/* Imagem + overlay */}
      <div className="relative bg-gradient-to-br from-lilac-100 to-petal-100 h-48 flex items-center justify-center overflow-hidden">
        <span className="text-5xl">🌸</span>
        <div
          className="absolute inset-0 bg-ink-800/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => onQuickView(product)}
        >
          <button className="bg-white text-ink-800 text-xs font-semibold px-4 py-2 rounded-pill shadow-md hover:bg-ink-50 transition-colors">
            👁 Ver rápido
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-lilac-500 mb-1">
          {product.category.name}
        </div>
        <div className="text-sm font-medium text-ink-800 mb-3 leading-snug">
          {product.name}
        </div>

        {/* Pills de variante */}
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.variants.map(variant => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                className={`px-2.5 py-1 text-[11px] rounded-pill border transition-colors ${
                  selectedVariantId === variant.id
                    ? 'border-ink-800 text-ink-800 font-medium'
                    : 'border-ink-200 text-ink-500 hover:border-lilac-500 hover:text-lilac-500'
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Preço + botão */}
        <div className="flex items-center justify-between">
          <div>
            {showFromLabel && (
              <div className="text-[10px] text-ink-500 leading-none mb-0.5">a partir de</div>
            )}
            <div className="font-display italic text-lg text-ink-800">
              {formatPrice(displayPrice)}
            </div>
          </div>
          <button
            onClick={() => onQuickView(product)}
            className="w-8 h-8 rounded-full bg-ink-800 hover:bg-lilac-500 text-white flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `frontend/src/components/features/QuickViewDialog.tsx`**

```tsx
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Product } from '@/services/productService'

interface QuickViewDialogProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

export function QuickViewDialog({ product, open, onClose }: QuickViewDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)

  if (!product) return null

  const activeVariantId = selectedVariantId ?? product.variants[0]?.id
  const selectedVariant = product.variants.find(v => v.id === activeVariantId)
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price)

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Imagem */}
          <div className="bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center min-h-72">
            <span className="text-8xl">🌸</span>
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4 items-start">
              <Badge
                variant="outline"
                className="w-fit text-lilac-500 border-lilac-200 mb-2 text-[10px]"
              >
                {product.category.name}
              </Badge>
              <DialogTitle className="text-xl font-medium text-ink-800 leading-snug text-left">
                {product.name}
              </DialogTitle>
            </DialogHeader>

            {product.description && (
              <p className="text-sm text-ink-500 leading-relaxed mb-4">
                {product.description.length > 120
                  ? product.description.slice(0, 120) + '...'
                  : product.description}
              </p>
            )}

            {/* Variantes */}
            {product.variants.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
                  Tamanho
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-3 py-1.5 text-xs rounded-pill border transition-colors ${
                        activeVariantId === variant.id
                          ? 'border-ink-800 text-ink-800 font-medium'
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
            <div className="font-display italic text-3xl text-ink-800 mb-6">
              {formatPrice(displayPrice)}
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <Button className="bg-ink-800 hover:bg-ink-700 text-white w-full">
                Adicionar ao carrinho
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={`/produto/${product.slug}`}>Ver produto completo</a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: apenas erros de `StorePage` não encontrado. Nenhum erro nos componentes acima.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/features/
git commit -m "feat(frontend): ProductCard e QuickViewDialog"
```

---

## Task 7: Frontend — StorePage

**Files:**
- Create: `frontend/src/pages/store/StorePage.tsx`

- [ ] **Step 1: Criar `frontend/src/pages/store/StorePage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { productService, type Product } from '@/services/productService'
import { categoryService, type Category } from '@/services/categoryService'

export function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [sort, setSort] = useState('newest')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    categoryService.findAll().then(setCategories)
  }, [])

  useEffect(() => {
    const slug = searchParams.get('categoria')
    if (slug && categories.length > 0) {
      const cat = categories.find(c => c.slug === slug)
      setSelectedCategoryId(cat?.id ?? null)
    }
  }, [searchParams, categories])

  useEffect(() => {
    setLoading(true)
    productService
      .findAll(selectedCategoryId ?? undefined, sort)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [selectedCategoryId, sort])

  const totalProducts = categories.reduce((acc, c) => acc + c._count.products, 0)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-10">
        {/* Cabeçalho */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display italic text-4xl text-ink-800">
              Nossa <span className="text-lilac-500">Loja</span>
            </h1>
            <p className="text-sm text-ink-500 mt-1">Flores frescas, entregues com carinho</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">{products.length} produtos</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-sm border border-ink-200 rounded-md px-3 py-1.5 text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
            >
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
            </select>
          </div>
        </div>

        {/* Layout: sidebar + grid */}
        <div className="grid grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <div className="sticky top-24">
            <div className="bg-white border border-ink-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-800">
                  Categorias
                </h4>
                {selectedCategoryId && (
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-xs text-lilac-500 hover:text-lilac-600 transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer group/label">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategoryId === null}
                    onChange={() => setSelectedCategoryId(null)}
                    className="accent-ink-800"
                  />
                  <span className="text-sm text-ink-600 group-hover/label:text-ink-800 flex-1 transition-colors">
                    Todas
                  </span>
                  <span className="text-[11px] text-lilac-500 bg-lilac-50 rounded-pill px-2 py-0.5">
                    {totalProducts}
                  </span>
                </label>

                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group/label">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategoryId === cat.id}
                      onChange={() => setSelectedCategoryId(cat.id)}
                      className="accent-ink-800"
                    />
                    <span className="text-sm text-ink-600 group-hover/label:text-ink-800 flex-1 transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-lilac-500 bg-lilac-50 rounded-pill px-2 py-0.5">
                      {cat._count.products}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de produtos */}
          <div>
            {loading ? (
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-ink-200 rounded-lg h-72 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🌿</div>
                <h3 className="text-lg font-medium text-ink-800 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-sm text-ink-500">Tente outra categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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

- [ ] **Step 2: Verificar tipagem completa**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Testar página**

Com backend e frontend rodando, abrir `http://localhost:5173/loja`.

Esperado: grid com 12 cards, sidebar com 4 categorias + "Todas".

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/pages/store/StorePage.tsx
git commit -m "feat(frontend): StorePage com sidebar, grid e quick view"
```

---

## Task 8: Frontend — Header com Mega Menu

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Substituir `frontend/src/components/layout/Header.tsx` pelo código completo**

```tsx
import { useState, useEffect, useRef } from 'react'
import { Search, User, ShoppingBag, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { categoryService, type Category } from '@/services/categoryService'
import { productService, type ProductFeatured } from '@/services/productService'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(price))
}

export function Header() {
  const { isOpen, count, openCart, closeCart } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<ProductFeatured[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    categoryService.findAll().then(setCategories)
    productService.findFeatured().then(setFeatured)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 bg-ink-50/85 backdrop-blur-md border-b border-ink-200">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-10 max-w-7xl mx-auto px-7 py-4">
          {/* Logo */}
          <a
            href="/"
            className="relative flex items-center font-display italic text-2xl text-lilac-500"
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-petal-400" />
            Frésia
          </a>

          {/* Nav */}
          <nav className="flex gap-8 justify-center">
            <a href="/" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">
              Início
            </a>
            <a href="/loja" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">
              Loja
            </a>

            {/* Categorias com mega menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 transition-colors py-1"
              >
                Categorias
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-ink-200 rounded-xl shadow-xl p-5 grid grid-cols-[180px_1fr] gap-6 min-w-[540px] z-50">
                  {/* Categorias */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 mb-3">
                      Categorias
                    </div>
                    <a
                      href="/loja"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors"
                    >
                      Todas
                      <span className="text-[11px] text-lilac-500 bg-lilac-50 px-2 rounded-pill">
                        {categories.reduce((a, c) => a + c._count.products, 0)}
                      </span>
                    </a>
                    {categories.map(cat => (
                      <a
                        key={cat.id}
                        href={`/loja?categoria=${cat.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors"
                      >
                        {cat.name}
                        <span className="text-[11px] text-lilac-500 bg-lilac-50 px-2 rounded-pill">
                          {cat._count.products}
                        </span>
                      </a>
                    ))}
                  </div>

                  {/* Destaques */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 mb-3">
                      Destaques
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {featured.map(product => (
                        <a
                          key={product.id}
                          href={`/produto/${product.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="border border-ink-200 rounded-lg overflow-hidden hover:border-lilac-200 hover:shadow-sm transition-all"
                        >
                          <div className="bg-gradient-to-br from-lilac-100 to-petal-100 h-16 flex items-center justify-center text-2xl">
                            🌸
                          </div>
                          <div className="p-2">
                            <div className="text-xs font-medium text-ink-800 leading-snug truncate">
                              {product.name}
                            </div>
                            <div className="font-display italic text-sm text-lilac-500">
                              {formatPrice(product.price)}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="/sobre" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">
              Sobre nós
            </a>
            <a href="/contato" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1">
              Contato
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
              <User size={18} />
            </button>
            <button
              onClick={openCart}
              className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800 relative"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-petal-400 text-white text-[10px] font-bold flex items-center justify-center border-2 border-ink-50">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Offcanvas */}
      <Sheet open={isOpen} onOpenChange={open => !open && closeCart()}>
        <SheetContent side="right" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>Carrinho</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-48 text-ink-500 text-sm">
            Seu carrinho está vazio.
          </div>
        </SheetContent>
      </Sheet>
    </>
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
git add frontend/src/components/layout/Header.tsx
git commit -m "feat(frontend): header com mega menu de categorias e destaques"
```

---

## Task 9: Verificação e2e

- [ ] **Step 1: Garantir backend rodando**

```bash
curl -s http://localhost:3001/api/v1/health
```

Esperado: `{"status":"ok",...}`

- [ ] **Step 2: Testar página inicial**

Abrir `http://localhost:5173` — deve mostrar título Frésia + botão "Ver nossa loja".

- [ ] **Step 3: Testar página de loja**

Abrir `http://localhost:5173/loja` — deve mostrar 12 cards em grid 4 colunas com sidebar.

- [ ] **Step 4: Testar filtro de categoria**

Clicar em "Buquês" na sidebar — grid deve mostrar apenas 3 produtos. Clicar "Limpar" retorna 12.

- [ ] **Step 5: Testar quick view**

Passar mouse sobre um card — overlay "Ver rápido" aparece. Clicar — Dialog abre com imagem, nome, variantes, preço e botões.

- [ ] **Step 6: Testar mega menu**

Clicar em "Categorias" no header — painel abre com 4 categorias + 3 destaques. Clicar em uma categoria fecha o menu e navega para `/loja?categoria=slug` com filtro ativo.

- [ ] **Step 7: Commit final**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add -A
git commit -m "chore: verificacao e2e session 3a concluida"
```

---

## Self-Review

- [x] **Spec coverage:** backend services (Task 1), controllers+routes (Task 2), seed (Task 3), API verify (Task 4), axios+services+router (Task 5), ProductCard+QuickViewDialog (Task 6), StorePage (Task 7), Header mega menu (Task 8), e2e (Task 9)
- [x] **Sem placeholders:** todos os steps têm código completo
- [x] **Consistência de tipos:** `Product` e `ProductFeatured` definidos em `productService.ts` (Task 5) e usados corretamente em `ProductCard` (Task 6), `QuickViewDialog` (Task 6), `StorePage` (Task 7) e `Header` (Task 8). `Category` de `categoryService.ts` usada em `StorePage` e `Header`
- [x] **Ordem de imports:** `StorePage` importa de `@/components/features/` — esses componentes criados na Task 6 antes da Task 7
- [x] **`menuRef` posicionado corretamente:** o `ref` está no `<div>` que envolve o botão + o dropdown, não no `<nav>` — click outside funciona corretamente
- [x] **`rounded-pill` válido:** definido no `tailwind.config.ts` da Sessão 1
