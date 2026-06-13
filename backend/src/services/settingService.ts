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
  resend_api_key: '',
  resend_from_email: 'contato@fresiaflores.com.br',
  resend_from_name: 'Frésia Flores',
  email_subject_welcome: 'Bem-vinda à Frésia! 🌸',
  email_subject_password_reset: 'Redefinição de senha — Frésia',
  email_subject_order_confirmation: 'Pedido confirmado — Frésia',
  email_subject_order_status: 'Atualização do seu pedido — Frésia',
  email_subject_order_delivered: 'Seu pedido chegou! 🌸',
  email_subject_review_request: 'Como foi a sua experiência?',
  email_heading_welcome: 'Bem-vinda à Frésia! 🌸',
  email_heading_password_reset: 'Redefinição de senha',
  email_heading_order_confirmation: 'Pedido #{{pedido}} confirmado! 🌸',
  email_heading_order_status: 'Atualização do pedido #{{pedido}}',
  email_heading_order_delivered: 'Seu pedido chegou! 🌸',
  email_heading_review_request: 'Como foi a sua experiência?',
  email_body_welcome:
    'Olá, <strong>{{nome}}</strong>!<br><br>Estamos muito felizes em ter você aqui. Na Frésia você encontra arranjos e buquês feitos com carinho, perfeitos para cada momento especial.<br><br>Explore o nosso catálogo e se surpreenda!',
  email_body_password_reset:
    'Olá, <strong>{{nome}}</strong>!<br><br>Recebemos uma solicitação para redefinir a senha da sua conta na Frésia.<br>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.<br><br>Se você não fez essa solicitação, pode ignorar este e-mail.',
  email_body_order_confirmation:
    'Olá, <strong>{{nome}}</strong>!<br><br>Recebemos seu pedido e já estamos preparando tudo com carinho.{{entrega}}{{itens}}',
  email_body_order_status:
    'Olá, <strong>{{nome}}</strong>!<br><br>Seu pedido foi atualizado para: <strong style="color:#9b83e6">{{status}}</strong>.<br><br>Acesse sua conta para acompanhar todos os detalhes.',
  email_body_order_delivered:
    'Olá, <strong>{{nome}}</strong>!<br><br>Seu pedido <strong>#{{pedido}}</strong> foi entregue com sucesso.<br>Esperamos que você ame cada detalhe — flores com alma, entregues com carinho.<br><br>Obrigada por escolher a Frésia! 💜',
  email_body_review_request:
    'Olá, <strong>{{nome}}</strong>!<br><br>Esperamos que seu pedido <strong>#{{pedido}}</strong> tenha encantado! Sua opinião é muito importante para continuarmos melhorando nosso serviço.<br><br>Conta pra gente como foi?',
  email_custom_templates: '[]',
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
    const { mp_access_token, resend_api_key, ...safe } = all
    return safe
  },
}
