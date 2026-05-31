import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20'))
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true,
      },
    })
    res.json(posts)
  } catch (err) { next(err) }
})

router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: String(req.params.slug) },
      select: {
        id: true, title: true, slug: true, excerpt: true, body: true,
        coverUrl: true, publishedAt: true, isPublished: true,
      },
    })
    if (!post || !post.isPublished) return res.status(404).json({ error: 'Post não encontrado' })
    res.json(post)
  } catch (err) { next(err) }
})

export const publicPostController = router
