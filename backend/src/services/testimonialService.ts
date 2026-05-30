import { prisma } from '@/prisma/client'

interface TestimonialDTO {
  id: number
  clientName: string
  rating: number
  text: string
  isActive: boolean
  createdAt: Date
}

class TestimonialService {
  async getActive(): Promise<TestimonialDTO[]> {
    return prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getAll(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.testimonial.findMany({
        skip,
        take: pageSize,
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
  }): Promise<TestimonialDTO> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating deve ser entre 1 e 5')
    }

    return prisma.testimonial.create({
      data: {
        clientName: data.clientName,
        rating: data.rating,
        text: data.text,
        isActive: true
      }
    })
  }

  async update(
    id: number,
    data: Partial<{ clientName: string; rating: number; text: string; isActive: boolean }>
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
