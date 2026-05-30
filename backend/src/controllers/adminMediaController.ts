import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '@/prisma/client'

const router = Router()

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const base = path.parse(file.originalname).name.replace(/[^a-z0-9_-]/gi, '_')
    const ext = path.extname(file.originalname)
    cb(null, `${base}-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Apenas imagens são permitidas'))
  },
})

// GET /admin/media — lista paginada
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1')
    const pageSize = Math.min(100, parseInt((req.query.pageSize as string) || '50'))
    const search = (req.query.search as string) || ''

    const where = search ? { filename: { contains: search } } : {}
    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count({ where }),
    ])
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    next(err)
  }
})

// POST /admin/media — upload com registro no DB
router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' })
    const media = await prisma.media.create({
      data: {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        alt: req.body.alt || null,
      },
    })
    res.status(201).json(media)
  } catch (err) {
    next(err)
  }
})

// DELETE /admin/media/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string)
    const media = await prisma.media.findUnique({ where: { id } })
    if (!media) return res.status(404).json({ error: 'Mídia não encontrada' })

    const filePath = path.resolve(process.cwd(), 'public', media.url.replace(/^\//, ''))
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch { /* segue mesmo se falhar */ }

    await prisma.media.delete({ where: { id } })
    res.json({ message: 'Mídia removida' })
  } catch (err) {
    next(err)
  }
})

// POST /admin/media/sync — popular tabela com arquivos existentes em /uploads
router.post('/sync', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'))
    let added = 0
    for (const filename of files) {
      const exists = await prisma.media.findFirst({ where: { filename } })
      if (exists) continue
      const filePath = path.join(UPLOAD_DIR, filename)
      const stat = fs.statSync(filePath)
      const ext = path.extname(filename).slice(1).toLowerCase()
      const mimeTypes: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
      }
      await prisma.media.create({
        data: {
          url: `/uploads/${filename}`,
          filename,
          mimeType: mimeTypes[ext] || 'image/png',
          size: stat.size,
        },
      })
      added++
    }
    res.json({ added, total: files.length })
  } catch (err) {
    next(err)
  }
})

export const adminMediaController = router
