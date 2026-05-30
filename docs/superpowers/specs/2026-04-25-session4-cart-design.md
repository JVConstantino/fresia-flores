# Design: Sessão 4 — Carrinho

**Data:** 2026-04-25
**Status:** Aprovado

---

## Objetivo

Implementar o carrinho completo: store Zustand com persistência em localStorage, Sheet lateral com lista de itens (thumbnail + quantidade + preço), e conexão dos botões "Adicionar ao carrinho" no ProductPage e QuickViewDialog.

---

## Decisões

| Decisão | Escolha |
|---------|---------|
| Layout dos itens | Opção A: thumbnail + nome/variante/preço + controles [−] qty [+] |
| Persistência | `zustand/middleware/persist` → localStorage, chave `fresia-cart` |
| `isOpen` persiste? | Não — sempre começa fechado |
| Ação ao adicionar | Abre Sheet automaticamente |
| Item duplicado | Incrementa qty em 1 (mesmo productId + variantId) |
| Checkout | Botão placeholder → `/checkout` (implementado na Sessão 5) |

---

## Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `frontend/src/store/cartStore.ts` — reescrever com persist + CartItem completo |
| Criar | `frontend/src/components/features/CartSheet.tsx` — UI do carrinho |
| Modificar | `frontend/src/components/layout/Header.tsx` — usar CartSheet em vez de inline |
| Modificar | `frontend/src/pages/store/ProductPage.tsx` — conectar botão addItem |
| Modificar | `frontend/src/components/features/QuickViewDialog.tsx` — conectar botão addItem |

---

## cartStore.ts

### Tipos

```typescript
interface CartItem {
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
  count: number    // derivado: soma de qty
  total: number    // derivado: soma price * qty
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (productId: number, variantId: number | null) => void
  updateQty: (productId: number, variantId: number | null, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}
```

### Implementação

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      get count() { return get().items.reduce((acc, i) => acc + i.qty, 0) },
      get total() { return get().items.reduce((acc, i) => acc + i.price * i.qty, 0) },

      addItem: (newItem) => set(state => {
        const key = (i: CartItem) => `${i.productId}-${i.variantId}`
        const existing = state.items.find(i => key(i) === key({ ...newItem, qty: 1 }))
        if (existing) {
          return {
            items: state.items.map(i =>
              key(i) === key(existing) ? { ...i, qty: i.qty + 1 } : i
            ),
            isOpen: true,
          }
        }
        return { items: [...state.items, { ...newItem, qty: 1 }], isOpen: true }
      }),

      removeItem: (productId, variantId) => set(state => ({
        items: state.items.filter(
          i => !(i.productId === productId && i.variantId === variantId)
        ),
      })),

      updateQty: (productId, variantId, qty) => set(state => ({
        items: qty <= 0
          ? state.items.filter(i => !(i.productId === productId && i.variantId === variantId))
          : state.items.map(i =>
              i.productId === productId && i.variantId === variantId ? { ...i, qty } : i
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
```

> **Nota:** `count` e `total` são getters derivados — não armazenados no estado, calculados na hora.

---

## CartSheet.tsx

```
<Sheet open={isOpen} onOpenChange={open => !open && closeCart()}>
  <SheetContent side="right" className="w-96 flex flex-col">
    <SheetHeader>
      <SheetTitle>Carrinho</SheetTitle>
      {count > 0 && <span>{count} {count === 1 ? 'item' : 'itens'}</span>}

    {/* Estado vazio */}
    {items.length === 0 →
      <div centralizado>
        🛍 (ShoppingBag icon grande)
        "Seu carrinho está vazio"
        <Button> "Ver loja" → fecha + navega /loja
      </div>

    {/* Lista de itens */}
    {items.length > 0 →
      <ScrollArea flex-1>
        {items.map(item =>
          <div flex gap-3 py-3 border-b>
            <div thumbnail 56x56 rounded-md gradient lilac→petal>🌸</div>
            <div flex-1>
              <div text-[10px] uppercase text-lilac-500> {categoryName}
              <div text-sm font-medium> {productName} (truncado)
              <div text-xs text-ink-500> {variantName ?? 'Único'}
              <div flex justify-between mt-2>
                <div font-display italic> {formatPrice(price)}
                <div flex gap-1 items-center>
                  <button [−] → updateQty(qty-1)>
                  <span>{qty}</span>
                  <button [+] → updateQty(qty+1)>
              <button "Remover" text-xs text-ink-500 hover:text-red-500>

      <div footer sticky border-t p-4>
        <div flex justify-between>
          "Subtotal"
          <span font-display italic> {formatPrice(total)}
        <Button w-full bg-ink-800 rounded-pill mt-3> "Finalizar pedido" → /checkout
        <button w-full text-xs text-ink-500 mt-2> "Continuar comprando" → closeCart()
```

---

## Conexão dos botões

### ProductPage.tsx

```typescript
const { addItem } = useCartStore()

// No onClick do botão "Adicionar ao carrinho":
addItem({
  productId: product.id,
  productName: product.name,
  productSlug: product.slug,
  categoryName: product.category.name,
  variantId: selectedVariant?.id ?? null,
  variantName: selectedVariant?.name ?? null,
  price: displayPrice,
})
// openCart() é chamado dentro de addItem automaticamente
```

### QuickViewDialog.tsx

```typescript
// Mesma lógica — selectedVariant derivado de activeVariantId
addItem({
  productId: product.id,
  productName: product.name,
  productSlug: product.slug,
  categoryName: product.category.name,
  variantId: selectedVariant?.id ?? null,
  variantName: selectedVariant?.name ?? null,
  price: displayPrice,
})
```

### Header.tsx

```tsx
// Substitui o bloco inline do Sheet por:
import { CartSheet } from '@/components/features/CartSheet'
// ...
<CartSheet />
// Remove importações de Sheet, SheetContent, SheetHeader, SheetTitle que não serão mais usadas
```

---

## Critérios de Sucesso

1. Adicionar produto no ProductPage → Sheet abre com item
2. Adicionar mesmo produto+variante → qty passa de 1 para 2
3. Controles [−]/[+] atualizam qty e subtotal em tempo real
4. qty chega a 0 via [−] → item é removido
5. Link "Remover" remove o item
6. Recarregar página → itens persistem no localStorage
7. Badge do header reflete a contagem total de unidades
8. "Continuar comprando" fecha o Sheet
9. Carrinho vazio mostra estado vazio com botão para loja

---

## Fora do Escopo

- Checkout real com criação de pedido (Sessão 5)
- Campo de mensagem para o cartão (passado da ProductPage para o Order na Sessão 5)
- Cálculo de frete (Sessão 5)
