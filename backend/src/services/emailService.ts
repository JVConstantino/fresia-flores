import { Resend } from 'resend'
import { settingService } from './settingService'

const FRONTEND_URL =
  process.env.NODE_ENV === 'production' ? 'https://fresiaflores.com.br' : 'http://localhost:5173'

const LOGO_URL = `${FRONTEND_URL}/logo-fresia.png`

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function baseTemplate(heading: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f9f8fc;font-family:Arial,Helvetica,sans-serif;color:#1f1c26">
  <div style="max-width:560px;margin:0 auto;padding:40px 16px">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px">
      <img src="${LOGO_URL}" alt="Frésia Flores" height="56" style="height:56px;width:auto">
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:12px;border:1px solid #e8e4ef;padding:36px 32px">
      <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:#1f1c26">
        ${heading}
      </h1>
      <div style="font-size:15px;line-height:1.7;color:#4a4558">
        ${body}
      </div>
      ${cta ? `
      <div style="margin-top:28px">
        <a href="${cta.url}"
          style="display:inline-block;background:#9b83e6;color:#ffffff;padding:13px 28px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em">
          ${cta.label}
        </a>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <p style="color:#9991aa;font-size:12px;text-align:center;margin-top:24px;line-height:1.6">
      Frésia Flores &middot; Flores com alma, entregues com carinho.<br>
      <a href="${FRONTEND_URL}" style="color:#9b83e6;text-decoration:none">fresiaflores.com.br</a>
    </p>
  </div>
</body>
</html>`
}

async function getResend(): Promise<{ client: Resend; from: string } | null> {
  const apiKey = await settingService.get('resend_api_key')
  if (!apiKey) {
    console.warn('[emailService] resend_api_key não configurado — e-mail não enviado.')
    return null
  }
  const fromName = await settingService.get('resend_from_name')
  const fromEmail = await settingService.get('resend_from_email')

  return {
    client: new Resend(apiKey),
    from: `${fromName} <${fromEmail}>`,
  }
}

/** Substitui variáveis {{chave}} no texto do template */
function renderVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

/** Lê assunto, título e corpo de um template do banco (com defaults) */
async function getTemplate(key: string, vars: Record<string, string>) {
  const [subject, heading, body] = await Promise.all([
    settingService.get(`email_subject_${key}`),
    settingService.get(`email_heading_${key}`),
    settingService.get(`email_body_${key}`),
  ])
  return {
    subject: renderVars(subject, vars),
    heading: renderVars(heading, vars),
    body: renderVars(body, vars),
  }
}

async function send(to: string, subject: string, html: string) {
  const ctx = await getResend()
  if (!ctx) return
  try {
    await ctx.client.emails.send({ from: ctx.from, to, subject, html })
  } catch (err) {
    console.error('[emailService] Erro ao enviar e-mail:', err)
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendPasswordReset(to: string, name: string, resetLink: string) {
  const tpl = await getTemplate('password_reset', { nome: name })
  const html = baseTemplate(tpl.heading, tpl.body, { label: 'Redefinir senha', url: resetLink })
  await send(to, tpl.subject, html)
}

export async function sendWelcome(to: string, name: string) {
  const tpl = await getTemplate('welcome', { nome: name })
  const html = baseTemplate(tpl.heading, tpl.body, { label: 'Explorar catálogo', url: `${FRONTEND_URL}/loja` })
  await send(to, tpl.subject, html)
}

export interface OrderEmailSummary {
  id: number
  total: number
  neighborhoodName?: string | null
  items?: { name: string; qty: number; price: number }[]
}

export async function sendOrderConfirmation(to: string, name: string, order: OrderEmailSummary) {
  const itemsRows = order.items?.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px">
        <tr style="border-bottom:1px solid #e8e4ef">
          <th style="text-align:left;padding:6px 0;color:#6b6579;font-weight:600">Produto</th>
          <th style="text-align:center;padding:6px 0;color:#6b6579;font-weight:600">Qtd</th>
          <th style="text-align:right;padding:6px 0;color:#6b6579;font-weight:600">Valor</th>
        </tr>
        ${order.items.map(i => `
          <tr style="border-bottom:1px solid #f3f1f8">
            <td style="padding:7px 0;color:#3a3348">${i.name}</td>
            <td style="padding:7px 0;text-align:center;color:#3a3348">${i.qty}</td>
            <td style="padding:7px 0;text-align:right;color:#3a3348">${formatBRL(i.price)}</td>
          </tr>`).join('')}
        <tr>
          <td colspan="2" style="padding:10px 0 0;font-weight:700;color:#1f1c26">Total</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:700;color:#9b83e6">${formatBRL(order.total)}</td>
        </tr>
      </table>`
    : `<p style="margin-top:8px">Total: <strong style="color:#9b83e6">${formatBRL(order.total)}</strong></p>`

  const deliveryLine = order.neighborhoodName
    ? `<p>Entrega em: <strong>${order.neighborhoodName}</strong></p>`
    : ''

  const tpl = await getTemplate('order_confirmation', {
    nome: name,
    pedido: String(order.id),
    total: formatBRL(order.total),
    entrega: deliveryLine,
    itens: itemsRows,
  })
  const html = baseTemplate(tpl.heading, tpl.body, { label: 'Acompanhar meu pedido', url: `${FRONTEND_URL}/conta/pedidos` })
  await send(to, tpl.subject, html)
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  processing: 'Em preparação',
  shipped: 'Saiu para entrega',
  entregue: 'Entregue',
  paid: 'Pagamento aprovado',
  cancelled: 'Cancelado',
}

export async function sendOrderStatus(to: string, name: string, orderId: number, status: string) {
  const label = STATUS_LABELS[status] ?? status
  const tpl = await getTemplate('order_status', { nome: name, pedido: String(orderId), status: label })
  const html = baseTemplate(tpl.heading, tpl.body, { label: 'Ver meu pedido', url: `${FRONTEND_URL}/conta/pedidos` })
  await send(to, tpl.subject, html)
}

export async function sendOrderDelivered(to: string, name: string, orderId: number) {
  const tpl = await getTemplate('order_delivered', { nome: name, pedido: String(orderId) })
  const html = baseTemplate(tpl.heading, tpl.body, { label: 'Ver minha conta', url: `${FRONTEND_URL}/conta/pedidos` })
  await send(to, tpl.subject, html)
}

export async function sendReviewRequest(to: string, name: string, orderId: number) {
  const tpl = await getTemplate('review_request', { nome: name, pedido: String(orderId) })
  const html = baseTemplate(tpl.heading, tpl.body, { label: 'Deixar minha avaliação', url: `${FRONTEND_URL}/loja` })
  await send(to, tpl.subject, html)
}

export interface CustomTemplate {
  id: string
  name: string
  subject: string
  heading: string
  body: string
}

/** Envia um template personalizado (criado no painel admin) */
export async function sendCustom(to: string, template: CustomTemplate, vars: Record<string, string>) {
  const subject = renderVars(template.subject, vars)
  const heading = renderVars(template.heading, vars)
  const body = renderVars(template.body, vars)
  const html = baseTemplate(heading, body)
  await send(to, subject, html)
}

export const emailService = {
  sendPasswordReset,
  sendWelcome,
  sendOrderConfirmation,
  sendOrderStatus,
  sendOrderDelivered,
  sendReviewRequest,
  sendCustom,
}
