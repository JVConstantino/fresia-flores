import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId é obrigatório' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado' },
        { status: 500 }
      )
    }

    const payment = new Payment(client)

    const result = await payment.create({
      body: {
        transaction_amount: Number(order.total),
        description: `Pedido Frésia #${order.id}`,
        payment_method_id: 'pix',
        payer: {
          email: 'test@test.com',
        },
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: String(result.id),
        paymentStatus: 'pending',
        paymentMethod: 'pix',
      },
    })

    const pixData = (result as any).point_of_interaction?.transaction_data

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
      qrCode: pixData?.qr_code || '',
      qrCodeBase64: pixData?.qr_code_base64 || '',
      ticketUrl: pixData?.ticket_url || '',
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    )
  }
}
