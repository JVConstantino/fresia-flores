import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

async function verifyAdmin(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number
      isAdmin: boolean
    }

    if (!decoded.isAdmin) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        take: 5,
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          name: true,
          stock: true,
        },
      }),
    ])

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'cancelled' } },
    })

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        customerName: order.user?.name || 'Cliente',
        createdAt: order.createdAt,
      })),
      lowStockProducts,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    )
  }
}
