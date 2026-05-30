import { create } from 'zustand'

interface LoaderState {
  visible: boolean
  label: string | null
  show: (label?: string) => void
  hide: () => void
}

export const useLoaderStore = create<LoaderState>((set) => ({
  visible: false,
  label: null,
  show: (label) => set({ visible: true, label: label ?? null }),
  hide: () => set({ visible: false, label: null }),
}))
