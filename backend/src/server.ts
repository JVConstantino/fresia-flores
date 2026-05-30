import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'
import { authMiddleware } from './middlewares/authMiddleware'
import { adminMiddleware } from './middlewares/adminMiddleware'
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
import accountRouter from './routes/account'
import uploadRouter from './routes/upload'
import adminUsersRouter from './routes/adminUsers'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) cb(null, true)
    else cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.static('public'))

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
app.use('/api/v1/posts', publicPostController)

app.use(errorHandler)

app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`))
