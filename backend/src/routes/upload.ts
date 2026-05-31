import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '@/prisma/client'

const router = Router()

const uploadDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    const timestamp = Date.now()
    cb(null, `${name}-${timestamp}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Apenas imagens são permitidas'))
    }
  }
})

router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }
    const url = `/uploads/${req.file.filename}`
    const existing = await prisma.media.findFirst({ where: { filename: req.file.filename } })
    if (existing) {
      await prisma.media.update({
        where: { id: existing.id },
        data: { url, mimeType: req.file.mimetype, size: req.file.size },
      })
    } else {
      await prisma.media.create({
        data: {
          url,
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      })
    }
    res.json({ url, filename: req.file.filename })
  } catch (err) {
    next(err)
  }
})

export default router
