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
  productImages?: string
}

export interface CouponData {
  id: number
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  coupon: CouponData | null
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (productId: number, variantId: number | null) => void
  updateQty: (productId: number, variantId: number | null, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  applyCoupon: (coupon: CouponData) => void
  removeCoupon: () => void
}

const isSame = (a: CartItem, b: Omit<CartItem, 'qty'>) =>
  a.productId === b.productId && a.variantId === b.variantId

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      coupon: null,

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

      clearCart: () => set({ items: [], coupon: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
    }),
    {
      name: 'fresia-cart',
      partialize: state => ({ items: state.items, coupon: state.coupon }),
    }
  )
)

export const selectCount = (state: CartStore) =>
  state.items.reduce((acc, i) => acc + i.qty, 0)

export const selectTotal = (state: CartStore) =>
  state.items.reduce((acc, i) => acc + i.price * i.qty, 0)
