import { api } from '@/lib/axios'

export interface CreateOrderPayload {
  items: { productId: number; variantId?: number | null; qty: number; price: number }[]
  neighborhoodId?: number
  deliveryMethod: string
  deliveryMessage?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  cardToken?: string
  paymentMethodId?: string
  installments?: number
  cpf?: string
  couponId?: number
  discount?: number
  paymentMethod: 'card' | 'pix'
  isTestMode?: boolean
  // Delivery address for guest / whatsapp_quote
  street?: string
  number?: string
  complement?: string
  zipCode?: string
  neighborhoodName?: string
  city?: string
  state?: string
}

export interface OrderItemResult {
  productId: number
  variantId: number | null
  qty: number
  price: number
  product: { name: string }
  variant: { name: string } | null
}

export interface OrderResult {
  id: number
  status: string
  paymentStatus: string
  total: number
  paymentMethod: string
  createdAt: string
  items?: OrderItemResult[]
}

export const orderService = {
  async create(payload: CreateOrderPayload): Promise<OrderResult> {
    const { data } = await api.post<OrderResult>('/orders', payload)
    return data
  },
  async findMyOrders(): Promise<OrderResult[]> {
    const { data } = await api.get<OrderResult[]>('/account/orders')
    return data
  }
}
