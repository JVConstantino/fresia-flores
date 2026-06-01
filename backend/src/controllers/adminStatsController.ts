import { Router, Request, Response, NextFunction } from 'express'
import { adminStatsService } from '@/services/adminStatsService'

const router = Router()

router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminStatsService.getOverviewStats()
    return res.json(stats)
  } catch (err) {
    next(err)
  }
})

router.get('/sales-chart', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30
    const chart = await adminStatsService.getSalesChart(days)
    return res.json(chart)
  } catch (err) {
    next(err)
  }
})

router.get('/revenue-by-category', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminStatsService.getRevenueByCategory()
    return res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/top-products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5
    const data = await adminStatsService.getTopProducts(limit)
    return res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/orders-status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminStatsService.getOrdersStatus()
    return res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/channel-breakdown', async (_req, res, next) => {
  try { res.json(await adminStatsService.getChannelBreakdown()) } catch (e) { next(e) }
})

router.get('/payment-method-breakdown', async (_req, res, next) => {
  try { res.json(await adminStatsService.getPaymentMethodBreakdown()) } catch (e) { next(e) }
})

router.get('/inventory-alerts', async (_req, res, next) => {
  try { res.json(await adminStatsService.getInventoryAlerts()) } catch (e) { next(e) }
})

router.get('/operational-costs', async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '30')
    res.json(await adminStatsService.getOperationalCosts(days))
  } catch (e) { next(e) }
})

router.get('/customer-metrics', async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '30')
    res.json(await adminStatsService.getCustomerMetrics(days))
  } catch (e) { next(e) }
})

router.get('/advanced', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt((req.query.days as string) || '30')
    res.json(await adminStatsService.getAdvancedAnalytics(days))
  } catch (e) { next(e) }
})

export const adminStatsController = router
