import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

interface CheckoutState {
  // Dados Pessoais
  email: string
  name: string
  cpf: string
  phone: string

  // Entrega
  deliveryMethod: 'motoboy' | 'retirada'
  cep: string
  address: string
  addressNumber: string
  complement: string
  neighborhoodId: string

  // Smart Checkout (logged-in users)
  selectedAddressId: number | null
  selectedCardId: number | null
  paymentMethod: 'card' | 'pix'

  // Extra
  deliveryMessage: string

  // Ações
  setField: (field: keyof Omit<CheckoutState, 'setField' | 'reset' | 'setSelectedAddressId' | 'setSelectedCardId' | 'setPaymentMethod'>, value: string) => void
  setSelectedAddressId: (id: number | null) => void
  setSelectedCardId: (id: number | null) => void
  setPaymentMethod: (method: 'card' | 'pix') => void
  reset: () => void
}

const initialState = {
  email: '',
  name: '',
  cpf: '',
  phone: '',
  deliveryMethod: 'motoboy' as const,
  cep: '',
  address: '',
  addressNumber: '',
  complement: '',
  neighborhoodId: '',
  selectedAddressId: null as number | null,
  selectedCardId: null as number | null,
  paymentMethod: 'card' as const,
  deliveryMessage: ''
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => {
      // Auto-populate for logged-in users
      const user = useAuthStore.getState().user
      if (user) {
        set({
          name: user.name,
          email: user.email,
          phone: user.phone || ''
        })
      }

      return {
        ...initialState,
        setField: (field, value) => set({ [field]: value } as any),
        setSelectedAddressId: (id) => set({ selectedAddressId: id }),
        setSelectedCardId: (id) => set({ selectedCardId: id }),
        setPaymentMethod: (method) => set({ paymentMethod: method }),
        reset: () => set(initialState)
      }
    },
    {
      name: 'fresia-checkout-storage'
    }
  )
)
