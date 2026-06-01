import { prisma } from '@/prisma/client'

interface TestimonialDTO {
  id: number
  clientName: string
  rating: number
  text: string
  isActive: boolean
  productId?: number | null
  createdAt: Date
}

class TestimonialService {
  async getActive(productId?: number | null): Promise<TestimonialDTO[]> {
    return prisma.testimonial.findMany({
      where: {
        isActive: true,
        productId: productId === undefined ? null : productId
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getAll(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.testimonial.findMany({
        skip,
        take: pageSize,
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.testimonial.count()
    ])

    return {
      data,
      pagination: { page, pageSize, total }
    }
  }

  async create(data: {
    clientName: string
    rating: number
    text: string
    productId?: number | null
    isActive?: boolean
  }): Promise<TestimonialDTO> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating deve ser entre 1 e 5')
    }

    return prisma.testimonial.create({
      data: {
        clientName: data.clientName,
        rating: data.rating,
        text: data.text,
        productId: data.productId || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
  }

  async update(
    id: number,
    data: Partial<{ clientName: string; rating: number; text: string; isActive: boolean; productId?: number | null }>
  ): Promise<TestimonialDTO> {
    return prisma.testimonial.update({
      where: { id },
      data
    })
  }

  async delete(id: number): Promise<void> {
    await prisma.testimonial.delete({ where: { id } })
  }
}

export const testimonialService = new TestimonialService()
