import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerName, customerEmail, customerPhone, deliveryAddress, deliveryMessage, neighborhoodId } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Pedido deve ter pelo menos um item' },
        { status: 400 }
      )
    }

    // Calculate total
    let total = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 404 }
        )
      }

      const price = product.salePrice || product.price
      total += Number(price) * item.qty

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        qty: item.qty,
        price: Number(price),
      })
    }

    // Get delivery fee
    let deliveryFee = 0
    if (neighborhoodId) {
      const neighborhood = await prisma.neighborhood.findUnique({
        where: { id: neighborhoodId },
      })
      if (neighborhood) {
        deliveryFee = Number(neighborhood.deliveryFee)
      }
    }

    total += deliveryFee

    // Get user if authenticated
    let userId = null
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
        userId = decoded.userId
      } catch {
        // Not authenticated, continue as guest
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        deliveryMessage: deliveryMessage || null,
        neighborhoodId: neighborhoodId || null,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
