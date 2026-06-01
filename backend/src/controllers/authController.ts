import { Request, Response, NextFunction } from 'express'
import { authService, cookieOptions } from '../services/authService'

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone } = req.body
      const { user, token } = await authService.register(name, email, password, phone)
      res.cookie('token', token, cookieOptions())
      res.status(201).json(user)
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body
      const { user, token } = await authService.login(email, password)
      res.cookie('token', token, cookieOptions())
      res.json(user)
    } catch (err) {
      next(err)
    }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie('token')
    res.json({ message: 'ok' })
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.me((req as any).user.id)
      res.json(user)
    } catch (err) {
      next(err)
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { name, phone } = req.body
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Nome é obrigatório' })
      }
      const user = await authService.updateProfile(userId, { name, phone })
      res.json(user)
    } catch (err) {
      next(err)
    }
  },

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { currentPassword, newPassword } = req.body
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senhas são obrigatórias' })
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
      }
      await authService.updatePassword(userId, currentPassword, newPassword)
      res.json({ message: 'Senha atualizada com sucesso' })
    } catch (err) {
      next(err)
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' })
      }
      const resetLink = await authService.forgotPassword(email)
      console.log(`[PASSWORD RESET LINK]: ${resetLink}`)
      res.json({ 
        message: 'Se o email existir, um link de recuperação foi enviado.', 
        devLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined 
      })
    } catch (err) {
      next(err)
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body
      if (!token || !password) {
        return res.status(400).json({ error: 'Token e senha são obrigatórios' })
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' })
      }
      await authService.resetPassword(token, password)
      res.json({ message: 'Senha redefinida com sucesso' })
    } catch (err) {
      next(err)
    }
  },
}
