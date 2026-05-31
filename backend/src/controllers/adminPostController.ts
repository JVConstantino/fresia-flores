import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1')
    const pageSize = parseInt((req.query.pageSize as string) || '20')
    const [items, total] = await Promise.all([
      prisma.post.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.post.count(),
    ])
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } })
    if (!post) return res.status(404).json({ error: 'Post não encontrado' })
    res.json(post)
  } catch (err) { next(err) }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, slug, excerpt, body, coverUrl, isPublished } = req.body
    if (!title || !body) return res.status(400).json({ error: 'Título e corpo são obrigatórios' })
    const finalSlug = slug || slugify(title)
    const exists = await prisma.post.findUnique({ where: { slug: finalSlug } })
    if (exists) return res.status(409).json({ error: 'Slug já existe' })
    const post = await prisma.post.create({
      data: {
        title, slug: finalSlug, excerpt: excerpt || null, body,
        coverUrl: coverUrl || null,
        isPublished: !!isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    })
    res.status(201).json(post)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.post.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Post não encontrado' })

    const { title, slug, excerpt, body, coverUrl, isPublished } = req.body
    const data: any = {}
    if (title !== undefined) data.title = title
    if (slug !== undefined) data.slug = slug
    else if (title !== undefined && title !== existing.title) data.slug = slugify(title)
    if (excerpt !== undefined) data.excerpt = excerpt
    if (body !== undefined) data.body = body
    if (coverUrl !== undefined) data.coverUrl = coverUrl
    if (isPublished !== undefined) {
      data.isPublished = !!isPublished
      if (isPublished && !existing.publishedAt) data.publishedAt = new Date()
      if (!isPublished) data.publishedAt = null
    }

    const post = await prisma.post.update({ where: { id }, data })
    res.json(post)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.post.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (err) { next(err) }
})

export const adminPostController = router
