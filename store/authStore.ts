import { create } from 'zustand'

export interface AuthUser {
  id: string | number
  name: string
  email: string
  phone: string | null
  isAdmin: boolean
  avatarUrl?: string | null
  createdAt?: string | Date | null
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
  setUserAvatar: (avatarUrl: string | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
  setUserAvatar: (avatarUrl) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatarUrl } : null
    }))
}))
