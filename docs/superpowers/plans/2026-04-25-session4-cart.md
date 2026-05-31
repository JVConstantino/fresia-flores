# Sessão 4 — Carrinho

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o carrinho completo: store Zustand com persistência localStorage, Sheet lateral com itens/quantidades/subtotal, e botões "Adicionar ao carrinho" funcionando em ProductPage e QuickViewDialog.

**Architecture:** `cartStore.ts` é reescrito com `zustand/persist` e `CartItem` completo. `CartSheet.tsx` extrai a UI do carrinho do Header. `selectCount` e `selectTotal` são selectors exportados para derivar valores sem armazenar estado redundante.

**Tech Stack:** Zustand 5 + persist middleware, React 18, shadcn (Sheet, Button), lucide-react, TypeScript.

---

## Mapa de Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `frontend/src/store/cartStore.ts` — reescrever com persist + CartItem completo |
| Criar | `frontend/src/components/features/CartSheet.tsx` — UI completa do carrinho |
| Modificar | `frontend/src/components/layout/Header.tsx` — usar CartSheet, selector count |
| Modificar | `frontend/src/pages/store/ProductPage.tsx` — conectar addItem |
| Modificar | `frontend/src/components/features/QuickViewDialog.tsx` — conectar addItem |

---

## Task 1: cartStore.ts — Reescrever com persist

**Files:**
- Modify: `fresia-claude-setup/fresia/frontend/src/store/cartStore.ts`

- [ ] **Step 1: Substituir `frontend/src/store/cartStore.ts` na íntegra**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: number
  productName: string
  productSlug: string
  categoryName: string
  variantId: number | null
  variantName: string | null
  price: number
  qty: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (productId: number, variantId: number | null) => void
  updateQty: (productId: number, variantId: number | null, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

const isSame = (a: CartItem, b: Omit<CartItem, 'qty'>) =>
  a.productId === b.productId && a.variantId === b.variantId

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) =>
        set(state => {
          const existing = state.items.find(i => isSame(i, newItem))
          return {
            items: existing
              ? state.items.map(i => isSame(i, newItem) ? { ...i, qty: i.qty + 1 } : i)
              : [...state.items, { ...newItem, qty: 1 }],
            isOpen: true,
          }
        }),

      removeItem: (productId, variantId) =>
        set(state => ({
          items: state.items.filter(
            i => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      updateQty: (productId, variantId, qty) =>
        set(state => ({
          items:
            qty <= 0
              ? state.items.filter(
                  i => !(i.productId === productId && i.variantId === variantId)
                )
              : state.items.map(i =>
                  i.productId === productId && i.variantId === variantId
                    ? { ...i, qty }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'fresia-cart',
      partialize: state => ({ items: state.items }), // isOpen NÃO persiste
    }
  )
)

// Selectors derivados — não armazenados no estado
export const selectCount = (state: CartStore) =>
  state.items.reduce((acc, i) => acc + i.qty, 0)

export const selectTotal = (state: CartStore) =>
  state.items.reduce((acc, i) => acc + i.price * i.qty, 0)
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: pode haver erros em outros arquivos que ainda usam a interface antiga — OK neste momento, serão corrigidos nas próximas tasks.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/store/cartStore.ts
git commit -m "feat(frontend): cartStore com persist, CartItem e selectors"
```

---

## Task 2: CartSheet.tsx — UI do carrinho

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/components/features/CartSheet.tsx`

- [ ] **Step 1: Criar `frontend/src/components/features/CartSheet.tsx`**

```tsx
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCartStore, selectCount, selectTotal, type CartItem } from '@/store/cartStore'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQty } = useCartStore()

  return (
    <div className="flex gap-3 py-4 border-b border-ink-100 last:border-0">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-md bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center flex-shrink-0 text-2xl">
        🌸
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-lilac-500 mb-0.5">
          {item.categoryName}
        </div>
        <div className="text-sm font-medium text-ink-800 truncate">{item.productName}</div>
        <div className="text-xs text-ink-500 mb-2">{item.variantName ?? 'Único'}</div>

        <div className="flex items-center justify-between">
          <div className="font-display italic text-base text-ink-800">
            {formatPrice(item.price)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
              className="w-6 h-6 rounded-full border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
            >
              <Minus size={10} />
            </button>
            <span className="text-sm font-medium text-ink-800 w-5 text-center">
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
              className="w-6 h-6 rounded-full border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        <button
          onClick={() => removeItem(item.productId, item.variantId)}
          className="text-[10px] text-ink-500 hover:text-red-400 transition-colors mt-1"
        >
          Remover
        </button>
      </div>
    </div>
  )
}

export function CartSheet() {
  const { items, isOpen, closeCart } = useCartStore()
  const count = useCartStore(selectCount)
  const total = useCartStore(selectTotal)

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && closeCart()}>
      <SheetContent side="right" className="w-96 flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-ink-200 shrink-0">
          <SheetTitle className="text-base text-left">Carrinho</SheetTitle>
          {count > 0 && (
            <p className="text-xs text-ink-500 text-left">
              {count} {count === 1 ? 'item' : 'itens'}
            </p>
          )}
        </SheetHeader>

        {/* Estado vazio */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-5">
            <ShoppingBag size={40} className="text-ink-200" />
            <p className="text-sm font-medium text-ink-800">Seu carrinho está vazio</p>
            <p className="text-xs text-ink-500">Adicione produtos para continuar</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-pill"
              onClick={() => {
                closeCart()
                window.location.href = '/loja'
              }}
            >
              Ver loja
            </Button>
          </div>
        ) : (
          <>
            {/* Lista de itens */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.map(item => (
                <CartItemRow
                  key={`${item.productId}-${item.variantId}`}
                  item={item}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-ink-200 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-ink-500">Subtotal</span>
                <span className="font-display italic text-xl text-ink-800">
                  {formatPrice(total)}
                </span>
              </div>
              <Button
                className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
                onClick={() => {
                  window.location.href = '/checkout'
                }}
              >
                Finalizar pedido
              </Button>
              <button
                className="w-full text-xs text-ink-500 hover:text-ink-800 transition-colors mt-3"
                onClick={closeCart}
              >
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros no CartSheet.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/features/CartSheet.tsx
git commit -m "feat(frontend): CartSheet com itens, quantidade e subtotal"
```

---

## Task 3: Header.tsx — Usar CartSheet

**Files:**
- Modify: `fresia-claude-setup/fresia/frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Substituir `frontend/src/components/layout/Header.tsx` na íntegra**

```tsx
import { useState, useEffect, useRef } from 'react'
import { Search, User, ShoppingBag, ChevronDown } from 'lucide-react'
import { useCartStore, selectCount } from '@/store/cartStore'
import { CartSheet } from '@/components/features/CartSheet'
import { categoryService, type Category } from '@/services/categoryService'
import { productService, type ProductFeatured } from '@/services/productService'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(price))
}

export function Header() {
  const { openCart } = useCartStore()
  const count = useCartStore(selectCount)
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

      <CartSheet />
    </>
  )
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/layout/Header.tsx
git commit -m "feat(frontend): header usa CartSheet e selectCount"
```

---

## Task 4: ProductPage.tsx — Conectar addItem

**Files:**
- Modify: `fresia-claude-setup/fresia/frontend/src/pages/store/ProductPage.tsx`

- [ ] **Step 1: Adicionar import do cartStore**

No topo do arquivo `ProductPage.tsx`, adicionar após os imports existentes:

```tsx
import { useCartStore } from '@/store/cartStore'
```

- [ ] **Step 2: Adicionar hook no componente**

Dentro de `ProductPage()`, logo após as declarações de estado existentes:

```tsx
const { addItem } = useCartStore()
```

- [ ] **Step 3: Conectar o botão "Adicionar ao carrinho"**

Localizar o `<Button>` com texto "Adicionar ao carrinho" e adicionar `onClick`:

```tsx
<Button
  className="bg-ink-800 hover:bg-lilac-500 text-white w-full py-3 rounded-pill text-sm font-semibold transition-colors"
  onClick={() =>
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      price: displayPrice,
    })
  }
>
  Adicionar ao carrinho
</Button>
```

- [ ] **Step 4: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/pages/store/ProductPage.tsx
git commit -m "feat(frontend): ProductPage conecta addItem ao carrinho"
```

---

## Task 5: QuickViewDialog.tsx — Conectar addItem

**Files:**
- Modify: `fresia-claude-setup/fresia/frontend/src/components/features/QuickViewDialog.tsx`

- [ ] **Step 1: Adicionar import do cartStore**

No topo do arquivo `QuickViewDialog.tsx`:

```tsx
import { useCartStore } from '@/store/cartStore'
```

- [ ] **Step 2: Adicionar hook no componente**

Dentro de `QuickViewDialog()`, após as declarações existentes:

```tsx
const { addItem } = useCartStore()
```

- [ ] **Step 3: Conectar o botão "Adicionar ao carrinho"**

Localizar `<Button className="bg-ink-800 ...">Adicionar ao carrinho</Button>` e adicionar `onClick`:

```tsx
<Button
  className="bg-ink-800 hover:bg-ink-700 text-white w-full"
  onClick={() =>
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      price: displayPrice,
    })
  }
>
  Adicionar ao carrinho
</Button>
```

- [ ] **Step 4: Verificar tipagem completa**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros em todos os arquivos.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/features/QuickViewDialog.tsx
git commit -m "feat(frontend): QuickViewDialog conecta addItem ao carrinho"
```

---

## Task 6: Verificação e2e

- [ ] **Step 1: Adicionar pelo ProductPage**

Abrir `http://localhost:5173/produto/buque-primavera-rosa`.
Selecionar variante "Médio". Clicar "Adicionar ao carrinho".

Esperado: Sheet abre com 1 item "Buquê Primavera Rosa / Médio / R$ 119,00", badge no header mostra "1".

- [ ] **Step 2: Adicionar mesmo produto novamente**

Clicar "Adicionar ao carrinho" de novo (mesma variante).

Esperado: qty passa para 2, subtotal dobra.

- [ ] **Step 3: Controles de quantidade**

Clicar [−] → qty volta para 1. Clicar [−] de novo → item desaparece, carrinho fica vazio.

- [ ] **Step 4: Adicionar pelo QuickViewDialog**

Na loja (`/loja`), clicar "Ver rápido" em um produto. No Dialog, selecionar variante e clicar "Adicionar ao carrinho".

Esperado: Dialog fecha (o Sheet abre).

- [ ] **Step 5: Testar persistência**

Com itens no carrinho, recarregar a página (`F5`).

Esperado: itens permanecem no carrinho, badge do header mantém a contagem.

- [ ] **Step 6: Verificar estado vazio**

Remover todos os itens via link "Remover".

Esperado: estado vazio com ícone ShoppingBag, mensagem e botão "Ver loja".

- [ ] **Step 7: Commit final**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add -A
git commit -m "chore: verificacao e2e session 4 carrinho concluida"
```

---

## Self-Review

- [x] **Spec coverage:** cartStore reescrito (Task 1), CartSheet (Task 2), Header atualizado (Task 3), ProductPage conectado (Task 4), QuickViewDialog conectado (Task 5), e2e (Task 6)
- [x] **Sem placeholders:** código completo em todos os steps
- [x] **Consistência:** `CartItem` exportado no Task 1 e usado em `CartSheet` (Task 2). `selectCount`/`selectTotal` exportados no Task 1 e usados no Task 2 (CartSheet) e Task 3 (Header). `addItem` aceita `Omit<CartItem, 'qty'>` — os objetos passados nas Tasks 4 e 5 têm todos os campos necessários
- [x] **`selectedVariant` em QuickViewDialog:** é `product.variants.find(v => v.id === activeVariantId)` — pode ser `undefined` se `activeVariantId` não casar. O `?.id ?? null` e `?.name ?? null` tratam isso corretamente
- [x] **ScrollArea não necessária:** usada `overflow-y-auto` em div nativa — sem dependência extra
