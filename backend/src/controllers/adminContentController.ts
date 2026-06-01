import { Router, Request, Response, NextFunction } from 'express'
import { adminContentService } from '@/services/adminContentService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'
import { optionalAuthMiddleware } from '@/middlewares/authMiddleware'

const router = Router()

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// Get active banners
router.get('/banners', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await adminContentService.getBanners()
    const active = list.filter((b: any) => b.isActive).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    return res.json(active)
  } catch (err) { next(err) }
})

// Get active topbar
router.get('/topbars', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await adminContentService.getTopBars()
    const now = new Date()
    const active = list.find((t: any) => {
      if (!t.isActive) return false
      if (t.activeFrom && new Date(t.activeFrom) > now) return false
      if (t.activeTo && new Date(t.activeTo) < now) return false
      return true
    })
    return res.json(active || null)
  } catch (err) { next(err) }
})

// Get active popups
router.get('/popups', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await adminContentService.getPopups()
    const active = list.filter((p: any) => p.isActive)
    return res.json(active)
  } catch (err) { next(err) }
})

// ==========================================
// ADMIN ENDPOINTS (requires adminMiddleware)
// ==========================================

// Banners Admin
router.get('/admin/banners', adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminContentService.getBanners())
  } catch (err) { next(err) }
})

router.post('/admin/banners', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await adminContentService.getBanners()
    const newBanner = {
      $id: Math.random().toString(36).substring(2, 9),
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      order: parseInt(req.body.order || '0')
    }
    banners.push(newBanner)
    await adminContentService.saveBanners(banners)
    res.status(201).json(newBanner)
  } catch (err) { next(err) }
})

router.put('/admin/banners/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const banners = await adminContentService.getBanners()
    const idx = banners.findIndex((b: any) => b.$id === id)
    if (idx === -1) return res.status(404).json({ error: 'Banner não encontrado' })

    banners[idx] = { ...banners[idx], ...req.body }
    await adminContentService.saveBanners(banners)
    res.json(banners[idx])
  } catch (err) { next(err) }
})

router.delete('/admin/banners/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    let banners = await adminContentService.getBanners()
    banners = banners.filter((b: any) => b.$id !== id)
    await adminContentService.saveBanners(banners)
    res.status(204).send()
  } catch (err) { next(err) }
})

// Top Bars Admin
router.get('/admin/topbars', adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminContentService.getTopBars())
  } catch (err) { next(err) }
})

router.post('/admin/topbars', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topbars = await adminContentService.getTopBars()
    const newBar = {
      $id: Math.random().toString(36).substring(2, 9),
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    }
    topbars.push(newBar)
    await adminContentService.saveTopBars(topbars)
    res.status(201).json(newBar)
  } catch (err) { next(err) }
})

router.put('/admin/topbars/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const topbars = await adminContentService.getTopBars()
    const idx = topbars.findIndex((t: any) => t.$id === id)
    if (idx === -1) return res.status(404).json({ error: 'Barra não encontrada' })

    topbars[idx] = { ...topbars[idx], ...req.body }
    await adminContentService.saveTopBars(topbars)
    res.json(topbars[idx])
  } catch (err) { next(err) }
})

router.delete('/admin/topbars/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    let topbars = await adminContentService.getTopBars()
    topbars = topbars.filter((t: any) => t.$id !== id)
    await adminContentService.saveTopBars(topbars)
    res.status(204).send()
  } catch (err) { next(err) }
})

// Popups Admin
router.get('/admin/popups', adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await adminContentService.getPopups())
  } catch (err) { next(err) }
})

router.post('/admin/popups', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const popups = await adminContentService.getPopups()
    const newPopup = {
      $id: Math.random().toString(36).substring(2, 9),
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    }
    popups.push(newPopup)
    await adminContentService.savePopups(popups)
    res.status(201).json(newPopup)
  } catch (err) { next(err) }
})

router.put('/admin/popups/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const popups = await adminContentService.getPopups()
    const idx = popups.findIndex((p: any) => p.$id === id)
    if (idx === -1) return res.status(404).json({ error: 'Pop-up não encontrado' })

    popups[idx] = { ...popups[idx], ...req.body }
    await adminContentService.savePopups(popups)
    res.json(popups[idx])
  } catch (err) { next(err) }
})

router.delete('/admin/popups/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    let popups = await adminContentService.getPopups()
    popups = popups.filter((p: any) => p.$id !== id)
    await adminContentService.savePopups(popups)
    res.status(204).send()
  } catch (err) { next(err) }
})

export const adminContentController = router
