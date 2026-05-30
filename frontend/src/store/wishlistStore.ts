import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  favoriteIds: number[]
  addFavorite: (productId: number) => void
  removeFavorite: (productId: number) => void
  toggleFavorite: (productId: number) => void
  isFavorited: (productId: number) => boolean
  syncWithServer: (serverIds: number[]) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      addFavorite: (productId: number) => {
        set((state) => ({
          favoriteIds: Array.from(new Set([...state.favoriteIds, productId]))
        }))
      },

      removeFavorite: (productId: number) => {
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((id) => id !== productId)
        }))
      },

      toggleFavorite: (productId: number) => {
        const { isFavorited, addFavorite, removeFavorite } = get()
        if (isFavorited(productId)) {
          removeFavorite(productId)
        } else {
          addFavorite(productId)
        }
      },

      isFavorited: (productId: number) => {
        return get().favoriteIds.includes(productId)
      },

      syncWithServer: (serverIds: number[]) => {
        const local = get().favoriteIds
        const merged = Array.from(new Set([...local, ...serverIds]))
        set({ favoriteIds: merged })
      },

      clear: () => {
        set({ favoriteIds: [] })
      }
    }),
    {
      name: 'fresia-wishlist'
    }
  )
)
