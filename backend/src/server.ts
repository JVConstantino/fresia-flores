import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { errorHandler } from './middlewares/errorHandler'
import { authMiddleware } from './middlewares/authMiddleware'
import { adminMiddleware } from './middlewares/adminMiddleware'
import { emailService } from './services/emailService'
import { settingService } from './services/settingService'
import categoriesRouter from './routes/categories'
import productsRouter from './routes/products'
import authRouter from './routes/auth'
import citiesRouter from './routes/cities'
import neighborhoodsRouter from './routes/neighborhoods'
import ordersRouter from './routes/orders'
import adminCitiesRouter from './routes/admin/cities'
import adminNeighborhoodsRouter from './routes/admin/neighborhoods'
import adminNewsletterRouter from './routes/admin/newsletter'
import paymentRouter from './routes/payment'
import promotionsRouter from './routes/promotions'
import { newsletterController } from './controllers/newsletterController'
import { testimonialController } from './controllers/testimonialController'
import { adminPromotionController } from './controllers/adminPromotionController'
import { adminStatsController } from './controllers/adminStatsController'
import { adminProductController } from './controllers/adminProductController'
import { adminCategoryController } from './controllers/adminCategoryController'
import { adminOrderController } from './controllers/adminOrderController'
import { adminCouponController } from './controllers/adminCouponController'
import { adminSettingController } from './controllers/adminSettingController'
import { adminWebhookController } from './controllers/adminWebhookController'
import { adminMediaController } from './controllers/adminMediaController'
import { adminPostController } from './controllers/adminPostController'
import { publicPostController } from './controllers/publicPostController'
import { adminSupplyController } from './controllers/adminSupplyController'
import { adminPdvController } from './controllers/adminPdvController'
import { adminAuditController } from './controllers/adminAuditController'
import { publicSettingsController } from './controllers/publicSettingsController'
import { publicCouponController } from './controllers/publicCouponController'
import { publicDiscountController } from './controllers/publicDiscountController'
import { adminContentController } from './controllers/adminContentController'
import accountRouter from './routes/account'
import uploadRouter from './routes/upload'
import adminUsersRouter from './routes/adminUsers'

const app = express()
const PORT = process.env.PORT ?? 4000

// CORS configuration
const ALLOWED_ORIGINS = [
  'https://fresiaflores.com.br',
  'https://www.fresiaflores.com.br',
  process.env.CORS_ORIGIN, // domínio extra via env (ex: hostingersite.com)
].filter(Boolean)

const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    // Sem origin = same-origin ou curl → sempre permitir
    if (!origin) return cb(null, true)
    // Localhost em dev
    if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true)
    // Domínios permitidos (lista + hostingersite.com para staging)
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.hostingersite.com')) {
      return cb(null, true)
    }
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../public')))

// Rota raiz - em produção serve o frontend, em desenvolvimento retorna JSON
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.status(200).json({
      service: 'fresia-backend',
      status: 'ok',
      ts: Date.now(),
    })
  })
}

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))

// Rotas públicas
app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/upload', authMiddleware, uploadRouter)
app.use('/api/v1/cities', citiesRouter)
app.use('/api/v1/neighborhoods', neighborhoodsRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/payment', paymentRouter)
app.use('/api/v1/newsletter', newsletterController)
app.use('/api/v1/testimonials', testimonialController)
app.use('/api/v1/settings', publicSettingsController)
app.use('/api/v1/coupons', publicCouponController)
app.use('/api/v1/discounts', publicDiscountController)
app.use('/api/v1/promotions', promotionsRouter)
app.use('/api/v1/content', adminContentController)

// Rotas de conta (auth obrigatório)
app.use('/api/v1/account', accountRouter)

// Rotas admin (auth + admin)
app.use('/api/v1/admin/categories', authMiddleware, adminMiddleware, adminCategoryController)
app.use('/api/v1/admin/orders', authMiddleware, adminMiddleware, adminOrderController)
app.use('/api/v1/admin/promotions', authMiddleware, adminMiddleware, adminPromotionController)
app.use('/api/v1/admin/stats', authMiddleware, adminMiddleware, adminStatsController)
app.use('/api/v1/admin/products', authMiddleware, adminMiddleware, adminProductController)
app.use('/api/v1/admin/newsletter', authMiddleware, adminMiddleware, adminNewsletterRouter)
app.use('/api/v1/admin/cities', authMiddleware, adminMiddleware, adminCitiesRouter)
app.use('/api/v1/admin/neighborhoods', authMiddleware, adminMiddleware, adminNeighborhoodsRouter)
app.use('/api/v1/admin/coupons', authMiddleware, adminMiddleware, adminCouponController)
app.use('/api/v1/admin/settings', authMiddleware, adminMiddleware, adminSettingController)
app.use('/api/v1/admin/webhooks', authMiddleware, adminMiddleware, adminWebhookController)
app.use('/api/v1/admin/users', adminUsersRouter)
app.use('/api/v1/admin/media', authMiddleware, adminMiddleware, adminMediaController)
app.use('/api/v1/admin/posts', authMiddleware, adminMiddleware, adminPostController)
app.use('/api/v1/admin/supplies', authMiddleware, adminMiddleware, adminSupplyController)
app.use('/api/v1/admin/pdv', authMiddleware, adminMiddleware, adminPdvController)
app.use('/api/v1/admin/audit', authMiddleware, adminMiddleware, adminAuditController)

app.post('/api/v1/admin/email/test', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { template, to } = req.body as { template: string; to: string }
    if (!to || !template) return res.status(400).json({ error: 'Campos obrigatórios: template, to' })
    const dummyOrder = { id: 1, total: 149.9, neighborhoodName: 'Centro' }
    const name = 'Usuário Teste'
    if (template.startsWith('custom:')) {
      const customId = template.slice('custom:'.length)
      const raw = await settingService.get('email_custom_templates')
      let customs: any[] = []
      try { customs = JSON.parse(raw) } catch {}
      const custom = customs.find((t: any) => t.id === customId)
      if (!custom) return res.status(400).json({ error: `Template personalizado não encontrado: ${customId}` })
      await emailService.sendCustom(to, custom, { nome: name, pedido: '1', status: 'Confirmado', total: 'R$ 149,90' })
      return res.json({ ok: true, message: `E-mail de teste (${custom.name}) enviado para ${to}` })
    }
    switch (template) {
      case 'welcome':             await emailService.sendWelcome(to, name); break
      case 'password_reset':      await emailService.sendPasswordReset(to, name, 'https://fresiaflores.com.br/recuperar-senha?token=TEST'); break
      case 'order_confirmation':  await emailService.sendOrderConfirmation(to, name, dummyOrder); break
      case 'order_status':        await emailService.sendOrderStatus(to, name, 1, 'confirmed'); break
      case 'order_delivered':     await emailService.sendOrderDelivered(to, name, 1); break
      case 'review_request':      await emailService.sendReviewRequest(to, name, 1); break
      default: return res.status(400).json({ error: `Template desconhecido: ${template}` })
    }
    res.json({ ok: true, message: `E-mail de teste (${template}) enviado para ${to}` })
  } catch (err) { next(err) }
})

app.use('/api/v1/posts', publicPostController)

// Em produção, servir o frontend buildado
if (process.env.NODE_ENV === 'production') {
  // public/ está na raiz do app (um nível acima de dist/)
  const frontendPath = path.join(__dirname, '../public')

  // Servir arquivos estáticos do frontend
  app.use(express.static(frontendPath))

  // Fallback para SPA (React Router) - todas as rotas não-API retornam index.html
  // Express 5 usa sintaxe /*splat ao invés de *
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`)
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend servido de: ${path.join(__dirname, '../../frontend/dist')}`)
  }
})
