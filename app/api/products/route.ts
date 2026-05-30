import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('categoria')
    const sort = searchParams.get('sort') || 'newest'
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const featured = searchParams.get('destaque') === 'true'
    const promotion = searchParams.get('promocao') === 'true'
    const search = searchParams.get('search')

    const where: any = {}

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (featured) {
      where.isFeatured = true
    }

    if (promotion) {
      where.salePrice = { not: null }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    if (sort === 'price_desc') orderBy = { price: 'desc' }
    if (sort === 'name_asc') orderBy = { name: 'asc' }
    if (sort === 'name_desc') orderBy = { name: 'desc' }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: { select: { name: true, slug: true } },
      },
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
