import { MercadoPagoConfig, Payment } from 'mercadopago'

export function getPaymentClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw Object.assign(new Error('MP_ACCESS_TOKEN not configured'), { statusCode: 503 })
  }

  const client = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 }
  })

  return new Payment(client)
}
