import { prisma } from '@/prisma/client'

interface VariantInput {
  id?: number
  name: string
  description?: string
  price: number
  salePrice?: number | null
  stock: number
  images?: string
}

interface ProductInput {
  name?: string
  slug?: string
  description?: string
  shortDescription?: string
  categoryId?: number
  price?: number
  salePrice?: number | null
  stock?: number
  isActive?: boolean
  isFeatured?: boolean
  allowCoupons?: boolean
  images?: string
  tags?: string
  variants?: VariantInput[]
  specsTable?: string
}

class AdminProductService {
  async getAll(page: number = 1, pageSize: number = 10, category?: string, search?: string) {
    const skip = (page - 1) * pageSize
    const where: any = {}
    if (category) where.categoryId = parseInt(category)
    if (search) where.name = { contains: search }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return {
      data: data.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price.toString()),
        salePrice: p.salePrice ? parseFloat(p.salePrice.toString()) : null,
        stock: p.stock,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        isActive: p.isActive,
        images: p.images,
        slug: p.slug
      })),
      pagination: { page, pageSize, total }
    }
  }

  async getById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true
      }
    })
    if (!product) throw new Error('Produto não encontrado')
    return {
      ...product,
      price: parseFloat(product.price.toString()),
      salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : null,
    }
  }

  async create(input: ProductInput) {
    if (!input.name) throw Object.assign(new Error('Nome é obrigatório'), { statusCode: 400 })
    if (!input.price || input.price <= 0) throw Object.assign(new Error('Preço deve ser maior que 0'), { statusCode: 400 })
    if (!input.categoryId) throw Object.assign(new Error('Categoria é obrigatória'), { statusCode: 400 })

    const baseSlug = (input.slug || input.name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    let slug = baseSlug
    let suffix = 1
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    return prisma.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        price: Number(input.price),
        salePrice: input.salePrice ? Number(input.salePrice) : null,
        stock: input.stock ?? 0,
        categoryId: input.categoryId,
        isActive: input.isActive ?? true,
        images: input.images ?? null,
        variants: input.variants && input.variants.length > 0
          ? {
              createMany: {
                data: input.variants.map(v => ({
                  name: v.name,
                  description: v.description ?? null,
                  price: Number(Number(v.price)),
                  salePrice: v.salePrice ? Number(Number(v.salePrice)) : null,
                  stock: Number(v.stock),
                  images: v.images ?? null,
                }))
              }
            }
          : undefined,
      },
      include: { variants: true }
    })
  }

  async update(id: number, input: ProductInput) {
    const updateData: any = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.shortDescription !== undefined) updateData.shortDescription = input.shortDescription
    if (input.categoryId !== undefined) updateData.categoryId = Number(input.categoryId)
    if (input.price !== undefined) updateData.price = Number(Number(input.price))
    if (input.salePrice !== undefined) updateData.salePrice = input.salePrice ? Number(Number(input.salePrice)) : null
    if (input.stock !== undefined) updateData.stock = Number(input.stock)
    if (input.isActive !== undefined) updateData.isActive = Boolean(input.isActive)
    if (input.isFeatured !== undefined) updateData.isFeatured = Boolean(input.isFeatured)
    if (input.allowCoupons !== undefined) updateData.allowCoupons = Boolean(input.allowCoupons)
    if (input.images !== undefined) updateData.images = input.images
    if (input.slug !== undefined && input.slug) updateData.slug = input.slug

    const product = await prisma.product.update({ where: { id }, data: updateData })

    // Sincronizar variantes: deletar antigas e recriar
    if (input.variants !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: id } })
      if (input.variants.length > 0) {
        await prisma.productVariant.createMany({
          data: input.variants.map(v => ({
            productId: id,
            name: v.name,
            description: v.description ?? null,
            price: Number(Number(v.price)),
            salePrice: v.salePrice ? Number(Number(v.salePrice)) : null,
            stock: Number(v.stock),
            images: v.images ?? null,
          }))
        })
      }
    }

    return prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true }
    })
  }

  async delete(id: number) {
    await prisma.product.delete({ where: { id } })
  }

  async batchDelete(ids: number[]) {
    await prisma.product.deleteMany({ where: { id: { in: ids } } })
  }
}

export const adminProductService = new AdminProductService()
