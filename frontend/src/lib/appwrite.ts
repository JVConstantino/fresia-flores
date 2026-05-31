import { Client, Account, Databases, Storage, Functions } from 'appwrite'

export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'http://localhost:6900/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT || 'fresia')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'fresia'

export const COLLECTIONS = {
  products: 'products',
  product_variants: 'product_variants',
  categories: 'categories',
  orders: 'orders',
  order_items: 'order_items',
  neighborhoods: 'neighborhoods',
  cities: 'cities',
  coupons: 'coupons',
  promotions: 'promotions',
  webhooks: 'webhooks',
  webhook_logs: 'webhook_logs',
  newsletter: 'newsletter',
  testimonials: 'testimonials',
  settings: 'settings',
  addresses: 'addresses',
  customers: 'customers',
  inventory_movements: 'inventory_movements',
  notifications: 'notifications',
  audit_logs: 'audit_logs',
  banners: 'banners',
  top_bar: 'top_bar',
  popups: 'popups',
} as const
