import { prisma } from '@/prisma/client'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const adminCategoryService = {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
  },

  async create(data: { name: string; slug?: string; imageUrl?: string | null }) {
    if (!data.name) throw Object.assign(new Error('Nome é obrigatório'), { statusCode: 400 })
    const slug = data.slug || slugify(data.name)
    const exists = await prisma.category.findUnique({ where: { slug } })
    if (exists) throw Object.assign(new Error('Slug já existe'), { statusCode: 409 })
    return prisma.category.create({ data: { name: data.name, slug, imageUrl: data.imageUrl ?? null } })
  },

  async update(id: number, data: { name?: string; slug?: string; imageUrl?: string | null }) {
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) throw Object.assign(new Error('Categoria não encontrada'), { statusCode: 404 })
    const updateData: { name?: string; slug?: string; imageUrl?: string | null } = {}
    if (data.name) updateData.name = data.name
    if (data.slug) updateData.slug = data.slug
    else if (data.name) updateData.slug = slugify(data.name)
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    return prisma.category.update({ where: { id }, data: updateData })
  },

  async delete(id: number) {
    const products = await prisma.product.count({ where: { categoryId: id } })
    if (products > 0)
      throw Object.assign(new Error(`Categoria possui ${products} produto(s) e não pode ser excluída`), { statusCode: 409 })
    return prisma.category.delete({ where: { id } })
  },
}
