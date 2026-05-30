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
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar produtos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, slug, description, price, salePrice, stock, categoryId, images, isFeatured } = body

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price,
        salePrice: salePrice || null,
        stock: stock || 0,
        categoryId,
        images: images ? JSON.stringify(images) : '[]',
        isFeatured: isFeatured || false,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
