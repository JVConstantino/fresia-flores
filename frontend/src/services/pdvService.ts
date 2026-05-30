import { api } from '@/lib/axios'

export interface PdvProduct {
  id: number
  name: string
  slug: string
  price: number
  salePrice?: number | null
  stock: number
  images?: any
  category: { name: string }
  variants: { id: number; name: string; price: number; salePrice?: number | null; stock: number }[]
}

export interface PdvCustomer {
  id: number
  name: string
  email: string
  phone?: string | null
}

export interface PdvSaleItem {
  productId: number
  variantId?: number | null
  qty: number
  price: number
  name?: string
  variantName?: string
}

export const pdvService = {
  async searchProducts(search: string): Promise<PdvProduct[]> {
    const { data } = await api.get<PdvProduct[]>('/admin/pdv/products', { params: { search, limit: 30 } })
    return data
  },
  async searchCustomers(search: string): Promise<PdvCustomer[]> {
    const { data } = await api.get<PdvCustomer[]>('/admin/pdv/customers', { params: { search } })
    return data
  },
  async createSale(body: {
    items: PdvSaleItem[]
    customerId?: number
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    paymentMethod: string
    installments?: number
    discount?: number
  }) {
    const { data } = await api.post('/admin/pdv/sale', body)
    return data
  },
}
