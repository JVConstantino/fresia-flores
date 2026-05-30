import { prisma } from '@/prisma/client'

interface SubscriptionResult {
  id: number
  email: string
  active: boolean
  createdAt: Date
}

interface PaginatedResult {
  data: SubscriptionResult[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

class NewsletterService {
  async subscribe(email: string): Promise<SubscriptionResult> {
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email }
    })

    if (existing) {
      throw new Error('Email já inscrito')
    }

    const subscription = await prisma.newsletterSubscription.create({
      data: { email, active: true }
    })

    return {
      id: subscription.id,
      email: subscription.email,
      active: subscription.active,
      createdAt: subscription.createdAt
    }
  }

  async getSubscriptions(
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResult> {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.newsletterSubscription.findMany({
        where: { active: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.newsletterSubscription.count({
        where: { active: true }
      })
    ])

    return {
      data: data.map(sub => ({
        id: sub.id,
        email: sub.email,
        active: sub.active,
        createdAt: sub.createdAt
      })),
      pagination: {
        page,
        pageSize,
        total
      }
    }
  }

  async unsubscribe(email: string): Promise<void> {
    await prisma.newsletterSubscription.update({
      where: { email },
      data: { active: false }
    })
  }
}

export const newsletterService = new NewsletterService()
