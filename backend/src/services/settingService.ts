import { prisma } from '@/prisma/client'

const DEFAULTS: Record<string, string> = {
  store_name: 'Frésia',
  store_phone: '',
  store_address: '',
  store_city: '',
  store_state: '',
  store_hours: '',
  store_instagram: '',
  store_whatsapp: '',
  min_order_value: '0',
  free_shipping_above: '0',
  payment_pix_enabled: 'true',
  payment_card_enabled: 'true',
  payment_max_installments: '3',
  mp_public_key: '',
  mp_access_token: '',
}

export const settingService = {
  async getAll(): Promise<Record<string, string>> {
    const rows = await prisma.setting.findMany()
    const result: Record<string, string> = { ...DEFAULTS }
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  },

  async get(key: string): Promise<string> {
    const row = await prisma.setting.findUnique({ where: { key } })
    return row?.value ?? DEFAULTS[key] ?? ''
  },

  async updateMany(data: Record<string, string>) {
    const ops = Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
    await Promise.all(ops)
    return this.getAll()
  },

  /** Retorna configurações públicas (sem chaves sensíveis) */
  async getPublic(): Promise<Record<string, string>> {
    const all = await this.getAll()
    const { mp_access_token, ...safe } = all
    return safe
  },
}
