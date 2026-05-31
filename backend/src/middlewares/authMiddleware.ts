import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies?.token as string | undefined) || req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Não autorizado' })

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; isAdmin: boolean }
    ;(req as any).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Não autorizado' })
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies?.token as string | undefined) || req.headers.authorization?.split(' ')[1]
  if (!token) return next()

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; isAdmin: boolean }
    ;(req as any).user = payload
  } catch {
    // Ignorar erro se o token for inválido
  }
  next()
}
