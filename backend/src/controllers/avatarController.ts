import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/prisma/client'
import fs from 'fs'
import path from 'path'

export const avatarController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const file = req.file

      if (!file) {
        return res.status(400).json({ error: 'Arquivo não fornecido' })
      }

      // Validate file is an image
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedMimes.includes(file.mimetype)) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ error: 'Apenas imagens (JPEG, PNG, WebP) são permitidas' })
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ error: 'Arquivo muito grande (máx 5MB)' })
      }

      // Get current user to delete old avatar if exists
      const currentUser = await prisma.user.findUnique({ where: { id: userId } })
      if (currentUser?.avatarUrl) {
        const oldPath = path.join(process.cwd(), 'public', currentUser.avatarUrl.replace('/public/', ''))
        try {
          fs.unlinkSync(oldPath)
        } catch (err) {
          // Ignore if file doesn't exist
        }
      }

      // Generate filename: userId_timestamp_originalname
      const filename = `${userId}_${Date.now()}_${file.originalname}`
      const relativePath = `/uploads/${filename}`

      // Rename temp file to final location
      const finalPath = path.join(process.cwd(), 'public', 'uploads', filename)
      fs.renameSync(file.path, finalPath)

      // Update user in database
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: relativePath },
        select: { id: true, name: true, email: true, avatarUrl: true, phone: true, isAdmin: true }
      })

      res.json(user)
    } catch (err) {
      next(err)
    }
  }
}
