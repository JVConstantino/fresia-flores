import { prisma } from '@/prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  isAdmin: boolean
}

function signToken(userId: number, isAdmin: boolean) {
  return jwt.sign({ id: userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' })
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
  }
}

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ user: AuthUser; token: string }> {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw Object.assign(new Error('Email já está em uso'), { statusCode: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone: phone ?? null },
      select: { id: true, name: true, email: true, phone: true, isAdmin: true },
    })
    return { user, token: signToken(user.id, user.isAdmin) }
  },

  async login(
    email: string,
    password: string
  ): Promise<{ user: AuthUser; token: string }> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 })
    }
    return {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin },
      token: signToken(user.id, user.isAdmin),
    }
  },

  async me(userId: number): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, isAdmin: true },
    })
    if (!user) {
      throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 })
    }
    return user
  },

  async updateProfile(
    userId: number,
    data: { name: string; phone?: string }
  ): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, phone: data.phone ?? null },
      select: { id: true, name: true, email: true, phone: true, isAdmin: true },
    })
    return user
  },

  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 })
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw Object.assign(new Error('Senha atual incorreta'), { statusCode: 400 })
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  },

  async forgotPassword(email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } })
    const token = jwt.sign({ email, purpose: 'reset-password' }, JWT_SECRET, { expiresIn: '1h' })
    // If staging/production domain is set in VITE_API_URL or config, we can map to it, but localhost is great for testing
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://fresiaflores.com.br' : 'http://localhost:5173'
    return `${baseUrl}/recuperar-senha?token=${token}`
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string; purpose: string }
      if (decoded.purpose !== 'reset-password') {
        throw Object.assign(new Error('Token inválido'), { statusCode: 400 })
      }
      const user = await prisma.user.findUnique({ where: { email: decoded.email } })
      if (!user) {
        throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 })
      }
      const passwordHash = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      })
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw Object.assign(new Error('Token expirou'), { statusCode: 400 })
      }
      throw Object.assign(new Error('Token inválido ou expirado'), { statusCode: 400 })
    }
  },
}
