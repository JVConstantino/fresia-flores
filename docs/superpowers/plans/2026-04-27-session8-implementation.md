# Session 8: Home Page + Dashboard Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Home Page (hero, categories, promos, newsletter, testimonials) + Dashboard Admin (overview, stats, CRUD for products/categories/promotions, order management) with charts and advanced data tables.

**Architecture:** 
- Backend: Database schema updates (3 new tables), API endpoints (25+), controllers/services following existing patterns
- Frontend: Home Page with 6 sections + Admin Dashboard with sidebar layout, stat cards, 4 chart types, advanced DataTable component with filtering/sorting/batch operations
- Home and Admin are independent page hierarchies under React Router, sharing common components (DataTable, Button, Input, etc)

**Tech Stack:** 
- Backend: Express, Prisma ORM, MySQL
- Frontend: React 18, React Router v6, React Hook Form + Zod, Recharts (charts), Zustand (state)
- Components: shadcn/ui primitives, custom DataTable, Recharts charts (Line, Pie, Bar, Donut)

---

## File Structure Overview

### Backend Files (Create/Modify)

```
backend/src/
├── routes/
│   ├── admin/
│   │   ├── products.ts (new)
│   │   ├── categories.ts (new)
│   │   ├── promotions.ts (new)
│   │   ├── orders.ts (new - modify existing)
│   │   └── stats.ts (new)
│   └── public/
│       ├── promotions.ts (new)
│       ├── testimonials.ts (new)
│       └── newsletter.ts (new)
├── controllers/
│   ├── adminProductController.ts (new)
│   ├── adminCategoryController.ts (new)
│   ├── adminPromotionController.ts (new)
│   ├── adminStatsController.ts (new)
│   ├── testimonialController.ts (new)
│   └── newsletterController.ts (new)
├── services/
│   ├── adminProductService.ts (new)
│   ├── adminPromotionService.ts (new)
│   ├── adminStatsService.ts (new)
│   ├── testimonialService.ts (new)
│   └── newsletterService.ts (new)
└── prisma/
    ├── schema.prisma (modify - add Promotion, Testimonial, NewsletterSubscription)
    └── migrations/ (auto-generated)
```

### Frontend Files (Create/Modify)

```
frontend/src/
├── pages/
│   ├── HomePage.tsx (new)
│   └── admin/
│       ├── AdminDashboard.tsx (new)
│       ├── products/
│       │   ├── ProductList.tsx (new)
│       │   └── ProductForm.tsx (new)
│       ├── categories/
│       │   └── CategoryList.tsx (new)
│       ├── promotions/
│       │   ├── PromotionList.tsx (new)
│       │   └── PromotionForm.tsx (new)
│       └── orders/
│           └── OrderList.tsx (new)
├── components/
│   ├── features/
│   │   ├── ProductCard.tsx (new)
│   │   ├── CategoryCard.tsx (new)
│   │   ├── TestimonialCard.tsx (new)
│   │   ├── SearchBar.tsx (new)
│   │   ├── NewsletterSection.tsx (new)
│   │   └── PromoSlider.tsx (new)
│   └── admin/
│       ├── AdminLayout.tsx (new)
│       ├── AdminSidebar.tsx (new)
│       ├── AdminHeader.tsx (new)
│       ├── StatCard.tsx (new)
│       ├── DataTable.tsx (new - reusable advanced table)
│       ├── ChartLine.tsx (new)
│       ├── ChartPie.tsx (new)
│       ├── ChartBar.tsx (new)
│       └── ChartDonut.tsx (new)
├── services/
│   ├── homeService.ts (new)
│   ├── adminProductService.ts (new)
│   ├── adminPromotionService.ts (new)
│   ├── adminStatsService.ts (new)
│   ├── adminOrderService.ts (new)
│   ├── testimonialService.ts (new)
│   └── newsletterService.ts (new)
├── hooks/
│   ├── useStats.ts (new)
│   ├── useAdminProducts.ts (new)
│   ├── useAdminPromotions.ts (new)
│   ├── useNewsletter.ts (new)
│   └── useAdminOrders.ts (new)
├── types/ (new)
│   ├── admin.ts (PromotionType, ProductType, etc)
│   └── home.ts (TestimonialType, etc)
└── App.tsx (modify - add routes)
```

---

## Task Breakdown (25 tasks total)

### Phase 1: Database & Backend Setup (5 tasks)

### Task 1: Update Prisma Schema with Promotion, Testimonial, NewsletterSubscription

**Files:**
- Modify: `backend/src/prisma/schema.prisma`

- [ ] **Step 1: Add Promotion model**

```prisma
model Promotion {
  id              Int      @id @default(autoincrement())
  name            String   @unique
  description     String?  @db.Text
  discountType    String   // "percentage" | "fixed"
  discountValue   Decimal  @db.Decimal(10, 2)
  validFrom       DateTime
  validTo         DateTime
  isActive        Boolean  @default(true)
  products        Product[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isActive])
  @@index([validFrom])
  @@index([validTo])
}
```

- [ ] **Step 2: Add Testimonial model**

```prisma
model Testimonial {
  id          Int     @id @default(autoincrement())
  clientName  String
  rating      Int     // 1-5
  text        String  @db.Text
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive])
}
```

- [ ] **Step 3: Add NewsletterSubscription model**

```prisma
model NewsletterSubscription {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([active])
}
```

- [ ] **Step 4: Update Product model to reference Promotion**

In the existing Product model, add:
```prisma
promotions   Promotion[]
```

- [ ] **Step 5: Run Prisma migration**

```bash
cd backend
npx prisma migrate dev --name add_promotion_testimonial_newsletter
```

Expected: Migration created and applied successfully, Prisma client regenerated.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add Promotion, Testimonial, NewsletterSubscription models"
```

---

### Task 2: Create Newsletter Service & Controller

**Files:**
- Create: `backend/src/services/newsletterService.ts`
- Create: `backend/src/controllers/newsletterController.ts`

- [ ] **Step 1: Write test for newsletter subscription**

Create `backend/src/services/__tests__/newsletterService.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { newsletterService } from '../newsletterService'

describe('newsletterService', () => {
  it('should subscribe new email to newsletter', async () => {
    const result = await newsletterService.subscribe('test@example.com')
    expect(result).toHaveProperty('id')
    expect(result.email).toBe('test@example.com')
    expect(result.active).toBe(true)
  })

  it('should reject duplicate email with conflict error', async () => {
    await newsletterService.subscribe('dup@example.com')
    await expect(
      newsletterService.subscribe('dup@example.com')
    ).rejects.toThrow('Email já inscrito')
  })

  it('should get paginated newsletter subscriptions', async () => {
    const result = await newsletterService.getSubscriptions(1, 10)
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('pagination')
    expect(Array.isArray(result.data)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- newsletterService.test.ts
```

Expected: FAIL - NewsletterService not defined

- [ ] **Step 3: Implement newsletter service**

Create `backend/src/services/newsletterService.ts`:

```typescript
import { prisma } from '@/prisma/client'

interface SubscriptionResult {
  id: number
  email: string
  active: boolean
  createdAt: Date
}

interface PaginatedResult {
  data: SubscriptionResult[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

class NewsletterService {
  async subscribe(email: string): Promise<SubscriptionResult> {
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email }
    })

    if (existing) {
      throw new Error('Email já inscrito')
    }

    const subscription = await prisma.newsletterSubscription.create({
      data: { email, active: true }
    })

    return {
      id: subscription.id,
      email: subscription.email,
      active: subscription.active,
      createdAt: subscription.createdAt
    }
  }

  async getSubscriptions(
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResult> {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.newsletterSubscription.findMany({
        where: { active: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.newsletterSubscription.count({
        where: { active: true }
      })
    ])

    return {
      data: data.map(sub => ({
        id: sub.id,
        email: sub.email,
        active: sub.active,
        createdAt: sub.createdAt
      })),
      pagination: {
        page,
        pageSize,
        total
      }
    }
  }

  async unsubscribe(email: string): Promise<void> {
    await prisma.newsletterSubscription.update({
      where: { email },
      data: { active: false }
    })
  }
}

export const newsletterService = new NewsletterService()
```

- [ ] **Step 4: Create newsletter controller**

Create `backend/src/controllers/newsletterController.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { newsletterService } from '@/services/newsletterService'

const router = Router()

router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email inválido' })
    }

    if (email.length > 100) {
      return res.status(400).json({ error: 'Email muito longo' })
    }

    const result = await newsletterService.subscribe(email)
    return res.status(201).json(result)
  } catch (err: any) {
    if (err.message.includes('já inscrito')) {
      return res.status(409).json({ error: err.message })
    }
    return res.status(500).json({ error: 'Erro ao inscrever' })
  }
})

export const newsletterController = router
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- newsletterService.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/newsletterService.ts \
        backend/src/controllers/newsletterController.ts \
        backend/src/services/__tests__/newsletterService.test.ts
git commit -m "feat: add newsletter subscription service and controller"
```

---

### Task 3: Create Testimonial Service & Controller

**Files:**
- Create: `backend/src/services/testimonialService.ts`
- Create: `backend/src/controllers/testimonialController.ts`

- [ ] **Step 1: Implement testimonial service**

Create `backend/src/services/testimonialService.ts`:

```typescript
import { prisma } from '@/prisma/client'

interface TestimonialDTO {
  id: number
  clientName: string
  rating: number
  text: string
  isActive: boolean
  createdAt: Date
}

class TestimonialService {
  async getActive(): Promise<TestimonialDTO[]> {
    return prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getAll(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.testimonial.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.testimonial.count()
    ])

    return {
      data,
      pagination: { page, pageSize, total }
    }
  }

  async create(data: {
    clientName: string
    rating: number
    text: string
  }): Promise<TestimonialDTO> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating deve ser entre 1 e 5')
    }

    return prisma.testimonial.create({
      data: {
        clientName: data.clientName,
        rating: data.rating,
        text: data.text,
        isActive: true
      }
    })
  }

  async update(
    id: number,
    data: Partial<{ clientName: string; rating: number; text: string; isActive: boolean }>
  ): Promise<TestimonialDTO> {
    return prisma.testimonial.update({
      where: { id },
      data
    })
  }

  async delete(id: number): Promise<void> {
    await prisma.testimonial.delete({ where: { id } })
  }
}

export const testimonialService = new TestimonialService()
```

- [ ] **Step 2: Create testimonial controller**

Create `backend/src/controllers/testimonialController.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { testimonialService } from '@/services/testimonialService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

// Public endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const testimonials = await testimonialService.getActive()
    return res.json(testimonials)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar testimonials' })
  }
})

// Admin endpoints
router.get('/admin', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = await testimonialService.getAll(page, pageSize)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar testimonials' })
  }
})

router.post('/admin', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientName, rating, text } = req.body

    if (!clientName || !text || !rating) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }

    const testimonial = await testimonialService.create({
      clientName,
      rating: parseInt(rating),
      text
    })

    return res.status(201).json(testimonial)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.put(
  '/admin/:id',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const testimonial = await testimonialService.update(id, req.body)
      return res.json(testimonial)
    } catch (err) {
      return res.status(404).json({ error: 'Testimonial não encontrado' })
    }
  }
)

router.delete(
  '/admin/:id',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      await testimonialService.delete(id)
      return res.status(204).send()
    } catch (err) {
      return res.status(404).json({ error: 'Testimonial não encontrado' })
    }
  }
)

export const testimonialController = router
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/testimonialService.ts \
        backend/src/controllers/testimonialController.ts
git commit -m "feat: add testimonial service and admin controller"
```

---

### Task 4: Create Admin Promotion Service & Controller

**Files:**
- Create: `backend/src/services/adminPromotionService.ts`
- Create: `backend/src/controllers/adminPromotionController.ts`

- [ ] **Step 1: Implement promotion service**

Create `backend/src/services/adminPromotionService.ts`:

```typescript
import { prisma } from '@/prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

interface PromotionInput {
  name: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  productIds: number[]
}

interface PromotionDTO {
  id: number
  name: string
  description?: string
  discountType: string
  discountValue: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  status: 'active' | 'expired' | 'inactive'
  productCount: number
  createdAt: Date
}

class AdminPromotionService {
  private getStatus(promotion: any): 'active' | 'expired' | 'inactive' {
    if (!promotion.isActive) return 'inactive'

    const now = new Date()
    if (now < promotion.validFrom || now > promotion.validTo) {
      return 'expired'
    }

    return 'active'
  }

  async getAll(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    search?: string
  ) {
    const skip = (page - 1) * pageSize
    const where: any = {}

    if (search) {
      where.name = { contains: search }
    }

    const [data, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip,
        take: pageSize,
        include: { products: { select: { id: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.promotion.count({ where })
    ])

    const promotions = data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      discountType: p.discountType,
      discountValue: parseFloat(p.discountValue.toString()),
      validFrom: p.validFrom,
      validTo: p.validTo,
      isActive: p.isActive,
      status: this.getStatus(p),
      productCount: p.products.length,
      createdAt: p.createdAt
    }))

    if (status && status !== 'all') {
      const filtered = promotions.filter(p => p.status === status)
      return {
        data: filtered,
        pagination: {
          page,
          pageSize,
          total: filtered.length
        }
      }
    }

    return {
      data: promotions,
      pagination: { page, pageSize, total }
    }
  }

  async getById(id: number) {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: { products: true }
    })

    if (!promotion) {
      throw new Error('Promoção não encontrada')
    }

    return {
      ...promotion,
      discountValue: parseFloat(promotion.discountValue.toString()),
      productIds: promotion.products.map(p => p.id)
    }
  }

  async create(input: PromotionInput) {
    // Validation
    if (input.validTo <= input.validFrom) {
      throw new Error('Data fim deve ser após data início')
    }

    if (input.discountValue <= 0) {
      throw new Error('Desconto deve ser maior que 0')
    }

    if (input.productIds.length === 0) {
      throw new Error('Mínimo 1 produto necessário')
    }

    const promotion = await prisma.promotion.create({
      data: {
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: new Decimal(input.discountValue),
        validFrom: input.validFrom,
        validTo: input.validTo,
        isActive: input.isActive,
        products: {
          connect: input.productIds.map(id => ({ id }))
        }
      },
      include: { products: true }
    })

    return {
      ...promotion,
      discountValue: parseFloat(promotion.discountValue.toString()),
      productIds: promotion.products.map(p => p.id)
    }
  }

  async update(id: number, input: Partial<PromotionInput>) {
    if (input.validFrom && input.validTo && input.validTo <= input.validFrom) {
      throw new Error('Data fim deve ser após data início')
    }

    const updateData: any = {
      name: input.name,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue
        ? new Decimal(input.discountValue)
        : undefined,
      validFrom: input.validFrom,
      validTo: input.validTo,
      isActive: input.isActive
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    )

    if (input.productIds && input.productIds.length > 0) {
      const promotion = await prisma.promotion.update({
        where: { id },
        data: {
          ...updateData,
          products: {
            set: input.productIds.map(pid => ({ id: pid }))
          }
        },
        include: { products: true }
      })
      return {
        ...promotion,
        discountValue: parseFloat(promotion.discountValue.toString()),
        productIds: promotion.products.map(p => p.id)
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData,
      include: { products: true }
    })

    return {
      ...promotion,
      discountValue: parseFloat(promotion.discountValue.toString()),
      productIds: promotion.products.map(p => p.id)
    }
  }

  async delete(id: number) {
    await prisma.promotion.delete({ where: { id } })
  }

  async getActive() {
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
      include: { products: true }
    })

    const now = new Date()
    return promotions
      .filter(p => p.validFrom <= now && now <= p.validTo)
      .map(p => ({
        id: p.id,
        name: p.name,
        discountType: p.discountType,
        discountValue: parseFloat(p.discountValue.toString()),
        products: p.products
      }))
  }
}

export const adminPromotionService = new AdminPromotionService()
```

- [ ] **Step 2: Create promotion controller**

Create `backend/src/controllers/adminPromotionController.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { adminPromotionService } from '@/services/adminPromotionService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

// Public endpoint
router.get('/active', async (req: Request, res: Response) => {
  try {
    const promotions = await adminPromotionService.getActive()
    return res.json(promotions)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar promoções' })
  }
})

// Admin endpoints
router.get('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined

    const result = await adminPromotionService.getAll(
      page,
      pageSize,
      status,
      search
    )
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar promoções' })
  }
})

router.get('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const promotion = await adminPromotionService.getById(parseInt(req.params.id))
    return res.json(promotion)
  } catch (err: any) {
    return res.status(404).json({ error: err.message })
  }
})

router.post('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const promotion = await adminPromotionService.create(req.body)
    return res.status(201).json(promotion)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const promotion = await adminPromotionService.update(
      parseInt(req.params.id),
      req.body
    )
    return res.json(promotion)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    await adminPromotionService.delete(parseInt(req.params.id))
    return res.status(204).send()
  } catch (err) {
    return res.status(404).json({ error: 'Promoção não encontrada' })
  }
})

export const adminPromotionController = router
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/adminPromotionService.ts \
        backend/src/controllers/adminPromotionController.ts
git commit -m "feat: add promotion service and admin controller"
```

---

### Task 5: Create Admin Stats Service & Controller

**Files:**
- Create: `backend/src/services/adminStatsService.ts`
- Create: `backend/src/controllers/adminStatsController.ts`

- [ ] **Step 1: Implement stats service**

Create `backend/src/services/adminStatsService.ts`:

```typescript
import { prisma } from '@/prisma/client'

class AdminStatsService {
  async getOverviewStats() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Current period (30 days)
    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const currentTotal = currentOrders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )

    // Previous period (30 days)
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    })

    const previousTotal = previousOrders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )

    const salesChange =
      previousTotal === 0
        ? 100
        : ((currentTotal - previousTotal) / previousTotal) * 100

    const currentOrdersCount = currentOrders.length
    const previousOrdersCount = previousOrders.length
    const ordersChange =
      previousOrdersCount === 0
        ? 100
        : ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100

    // Active customers (last 30 days)
    const activeCustomers = await prisma.order.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: thirtyDaysAgo } }
    })

    // Low stock products
    const lowStockCount = await prisma.product.count({
      where: { stock: { lt: 5 } }
    })

    return {
      totalSales: parseFloat(currentTotal.toFixed(2)),
      salesChange: parseFloat(salesChange.toFixed(1)),
      totalOrders: currentOrdersCount,
      ordersChange: parseFloat(ordersChange.toFixed(1)),
      activeCustomers: activeCustomers.length,
      lowStockProducts: lowStockCount
    }
  }

  async getSalesChart(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const dailySales: Record<string, number> = {}

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailySales[dateStr] = 0
    }

    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]
      const amount = parseFloat(order.total.toString())
      dailySales[dateStr] = (dailySales[dateStr] || 0) + amount
    })

    return Object.entries(dailySales).map(([date, sales]) => ({
      date,
      sales: parseFloat(sales.toFixed(2))
    }))
  }

  async getRevenueByCategory() {
    const result = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        price: true
      }
    })

    const categoryRevenue: Record<string, number> = {}

    for (const item of result) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { category: { select: { name: true } } }
      })

      if (product?.category) {
        categoryRevenue[product.category.name] =
          (categoryRevenue[product.category.name] || 0) +
          parseFloat((item._sum.price || 0).toString())
      }
    }

    return Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }))
  }

  async getTopProducts(limit: number = 5) {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    })

    const result = []

    for (const item of topProducts) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (product) {
        result.push({
          name: product.name,
          quantity: item._sum.quantity || 0
        })
      }
    }

    return result
  }

  async getOrdersStatus() {
    const statuses = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    })

    return statuses.map(s => ({
      name: this.translateStatus(s.status),
      value: s._count
    }))
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return map[status] || status
  }
}

export const adminStatsService = new AdminStatsService()
```

- [ ] **Step 2: Create stats controller**

Create `backend/src/controllers/adminStatsController.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { adminStatsService } from '@/services/adminStatsService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

router.get('/overview', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await adminStatsService.getOverviewStats()
    return res.json(stats)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar stats' })
  }
})

router.get(
  '/sales-chart',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30
      const chart = await adminStatsService.getSalesChart(days)
      return res.json(chart)
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar gráfico' })
    }
  }
)

router.get(
  '/revenue-by-category',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const data = await adminStatsService.getRevenueByCategory()
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar receita' })
    }
  }
)

router.get(
  '/top-products',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5
      const data = await adminStatsService.getTopProducts(limit)
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar top produtos' })
    }
  }
)

router.get(
  '/orders-status',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const data = await adminStatsService.getOrdersStatus()
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar status' })
    }
  }
)

export const adminStatsController = router
```

- [ ] **Step 3: Register routes in server.ts**

In `backend/src/server.ts`, add:

```typescript
import { adminStatsController } from '@/controllers/adminStatsController'
import { adminPromotionController } from '@/controllers/adminPromotionController'
import { testimonialController } from '@/controllers/testimonialController'
import { newsletterController } from '@/controllers/newsletterController'

app.use('/api/v1/admin/stats', adminStatsController)
app.use('/api/v1/admin/promotions', adminPromotionController)
app.use('/api/v1/testimonials', testimonialController)
app.use('/api/v1/newsletter', newsletterController)
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/adminStatsService.ts \
        backend/src/controllers/adminStatsController.ts \
        backend/src/server.ts
git commit -m "feat: add admin stats service, controller and register routes"
```

---

### Phase 2: Frontend Home Page (6 tasks)

### Task 6: Create Product and Category Card Components

**Files:**
- Create: `frontend/src/components/features/ProductCard.tsx`
- Create: `frontend/src/components/features/CategoryCard.tsx`

- [ ] **Step 1: Create ProductCard**

Create `frontend/src/components/features/ProductCard.tsx`:

```typescript
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

interface ProductCardProps {
  id: number
  name: string
  image?: string
  price: number
  originalPrice?: number
  discountPercent?: number
  slug: string
  category: string
  stock: number
}

export function ProductCard({
  id,
  name,
  image,
  price,
  originalPrice,
  discountPercent,
  slug,
  category,
  stock
}: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem)

  const handleAddToCart = () => {
    if (stock <= 0) {
      toast.error('Produto sem estoque')
      return
    }

    addItem({
      productId: id,
      productName: name,
      productSlug: slug,
      categoryName: category,
      variantId: null,
      variantName: null,
      price,
      productImages: image
    })

    toast.success('Adicionado ao carrinho')
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative w-full h-48 bg-ink-100 flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-ink-400 text-sm">Sem imagem</div>
        )}

        {discountPercent && (
          <div className="absolute top-2 right-2 bg-petal-400 text-white px-2 py-1 rounded-full text-sm font-semibold">
            -{discountPercent}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-ink-800 line-clamp-2">{name}</h3>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-lilac-500">R$ {price.toFixed(2)}</span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-ink-500 line-through">
              R$ {originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Button */}
        <Button
          onClick={handleAddToCart}
          disabled={stock <= 0}
          className="w-full mt-4 bg-lilac-500 hover:bg-lilac-600 text-white"
        >
          {stock > 0 ? 'Adicionar' : 'Sem estoque'}
        </Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create CategoryCard**

Create `frontend/src/components/features/CategoryCard.tsx`:

```typescript
import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'

interface CategoryCardProps {
  id: number
  name: string
  icon?: string
  image?: string
  productCount: number
}

export function CategoryCard({
  id,
  name,
  icon,
  image,
  productCount
}: CategoryCardProps) {
  return (
    <Link to={`/loja?category=${id}`}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full">
        {/* Image/Icon */}
        <div className="w-full h-40 bg-lilac-100 flex items-center justify-center text-4xl">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{icon || '🌸'}</span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 text-center">
          <h3 className="font-semibold text-ink-800">{name}</h3>
          <p className="text-sm text-ink-500 mt-1">
            {productCount} {productCount === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 3: Create TestimonialCard**

Create `frontend/src/components/features/TestimonialCard.tsx`:

```typescript
import { Card } from '@/components/ui/card'

interface TestimonialCardProps {
  id: number
  clientName: string
  text: string
  rating: number
  date?: Date
}

export function TestimonialCard({
  clientName,
  text,
  rating,
  date
}: TestimonialCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating)

  return (
    <Card className="p-6 max-w-sm">
      {/* Stars */}
      <div className="flex gap-1 mb-3">
        {stars.map((filled, i) => (
          <span key={i}>{filled ? '⭐' : '☆'}</span>
        ))}
      </div>

      {/* Text */}
      <p className="text-ink-700 text-sm leading-relaxed mb-4">"{text}"</p>

      {/* Author */}
      <p className="font-semibold text-ink-800">{clientName}</p>
      {date && (
        <p className="text-xs text-ink-500">
          {new Date(date).toLocaleDateString('pt-BR')}
        </p>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/features/ProductCard.tsx \
        frontend/src/components/features/CategoryCard.tsx \
        frontend/src/components/features/TestimonialCard.tsx
git commit -m "feat: add product, category and testimonial card components"
```

---

### Task 7: Create SearchBar and NewsletterSection Components

**Files:**
- Create: `frontend/src/components/features/SearchBar.tsx`
- Create: `frontend/src/components/features/NewsletterSection.tsx`

- [ ] **Step 1: Create SearchBar**

Create `frontend/src/components/features/SearchBar.tsx`:

```typescript
import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function SearchBar({
  onSearch,
  placeholder = 'Buscar flores, presentes...'
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        if (onSearch) {
          onSearch(query)
        } else {
          navigate(`/loja?search=${encodeURIComponent(query)}`)
        }
      }
    },
    [query, onSearch, navigate]
  )

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="flex-1"
      />
      <Button
        type="submit"
        className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill px-6"
      >
        🔍
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create NewsletterSection**

Create `frontend/src/components/features/NewsletterSection.tsx`:

```typescript
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { newsletterService } from '@/services/newsletterService'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Digite um email')
      return
    }

    setIsLoading(true)
    try {
      await newsletterService.subscribe(email)
      toast.success('Inscrito com sucesso!')
      setEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao inscrever')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="bg-lilac-100 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-ink-800 mb-2">
          Receba nossas novidades
        </h2>
        <p className="text-ink-600 mb-8">
          Inscreva-se para receber ofertas exclusivas e dicas de arranjos florais
        </p>

        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={100}
            className="flex-1 max-w-sm"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill px-8"
          >
            {isLoading ? 'Inscrevendo...' : 'Inscrever'}
          </Button>
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/features/SearchBar.tsx \
        frontend/src/components/features/NewsletterSection.tsx
git commit -m "feat: add search bar and newsletter section components"
```

---

### Task 8: Create Home Services

**Files:**
- Create: `frontend/src/services/homeService.ts`
- Create: `frontend/src/services/newsletterService.ts`

- [ ] **Step 1: Create homeService**

Create `frontend/src/services/homeService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

export const homeService = {
  getCategories: async () => {
    const { data } = await api.get('/categories')
    return data
  },

  getPromotions: async () => {
    const { data } = await api.get('/promotions/active')
    return data
  },

  getTestimonials: async () => {
    const { data } = await api.get('/testimonials')
    return data
  },

  searchProducts: async (query: string, limit: number = 20) => {
    const { data } = await api.get('/products', {
      params: { search: query, limit }
    })
    return data
  },

  getTrendingProducts: async (limit: number = 8) => {
    const { data } = await api.get('/products', {
      params: { limit, sort: 'trending' }
    })
    return data
  }
}
```

- [ ] **Step 2: Create newsletterService**

Create `frontend/src/services/newsletterService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

export const newsletterService = {
  subscribe: async (email: string) => {
    try {
      const { data } = await api.post('/newsletter/subscribe', { email })
      return data
    } catch (err: any) {
      if (err.response?.status === 409) {
        throw new Error('Email já está inscrito')
      }
      throw err
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/homeService.ts \
        frontend/src/services/newsletterService.ts
git commit -m "feat: add home and newsletter services"
```

---

### Task 9: Create HomePage Component

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: Create HomePage**

Create `frontend/src/pages/HomePage.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { ProductCard } from '@/components/features/ProductCard'
import { CategoryCard } from '@/components/features/CategoryCard'
import { TestimonialCard } from '@/components/features/TestimonialCard'
import { SearchBar } from '@/components/features/SearchBar'
import { NewsletterSection } from '@/components/features/NewsletterSection'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { homeService } from '@/services/homeService'
import { toast } from 'sonner'

interface Category {
  id: number
  name: string
  slug: string
  _count?: { products: number }
}

interface Product {
  id: number
  name: string
  slug: string
  price: number
  images?: string[]
  categoryId: number
  category?: { name: string }
  stock: number
}

interface Promotion {
  id: number
  name: string
  products: Product[]
  discountValue: number
  discountType: string
}

interface Testimonial {
  id: number
  clientName: string
  text: string
  rating: number
  createdAt: Date
}

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [catsData, promoData, testimData, trendData] = await Promise.all([
          homeService.getCategories(),
          homeService.getPromotions(),
          homeService.getTestimonials(),
          homeService.getTrendingProducts(8)
        ])

        setCategories(catsData)
        setPromotions(promoData)
        setTestimonials(testimData)
        setTrendingProducts(trendData)
      } catch (err) {
        console.error('Erro ao carregar dados da home:', err)
        toast.error('Erro ao carregar página')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>
  }

  return (
    <>
      <Helmet>
        <title>Frésia - Flores Frescas Entregues com Cuidado</title>
      </Helmet>

      {/* Hero Section */}
      <section
        className="relative h-96 bg-cover bg-center flex items-center justify-center text-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(/hero-flowers.jpg)'
        }}
      >
        <div className="max-w-2xl px-4">
          <h1 className="text-5xl font-bold text-white mb-4">
            Flores frescas entregues com cuidado
          </h1>
          <SearchBar />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-ink-800 mb-8">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map(cat => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                productCount={cat._count?.products || 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      {promotions.length > 0 && (
        <section className="py-16 bg-lilac-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-ink-800 mb-2">
              Flores em Promoção
            </h2>
            <p className="text-ink-600 mb-8">
              Aproveite nossas ofertas especiais
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {promotions.flatMap(promo =>
                promo.products.map(product => {
                  const discount =
                    promo.discountType === 'percentage'
                      ? promo.discountValue
                      : ((promo.discountValue / parseFloat(product.price.toString())) * 100).toFixed(0)

                  const discountedPrice =
                    promo.discountType === 'percentage'
                      ? product.price * (1 - promo.discountValue / 100)
                      : product.price - promo.discountValue

                  return (
                    <ProductCard
                      key={`${promo.id}-${product.id}`}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      image={product.images?.[0]}
                      price={discountedPrice}
                      originalPrice={product.price}
                      discountPercent={parseInt(discount.toString())}
                      category={product.category?.name || 'Sem categoria'}
                      stock={product.stock}
                    />
                  )
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-ink-800 mb-8">
            Mais Vendidos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                image={product.images?.[0]}
                price={product.price}
                category={product.category?.name || 'Sem categoria'}
                stock={product.stock}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/loja">
              <Button className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill px-8">
                Ver Loja Completa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSection />

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-ink-800 mb-8">
              O que Clientes Dizem
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map(testimonial => (
                <TestimonialCard
                  key={testimonial.id}
                  id={testimonial.id}
                  clientName={testimonial.clientName}
                  text={testimonial.text}
                  rating={testimonial.rating}
                  date={testimonial.createdAt}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
```

- [ ] **Step 2: Update App.tsx to add route**

In `frontend/src/App.tsx`, add the HomePage route:

```typescript
import { HomePage } from '@/pages/HomePage'

// Inside your routes definition:
<Route path="/" element={<HomePage />} />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/HomePage.tsx \
        frontend/src/App.tsx
git commit -m "feat: implement home page with categories, promos, testimonials"
```

---

### Phase 3: Admin Dashboard Structure (4 tasks)

### Task 10: Create Admin Layout Components

**Files:**
- Create: `frontend/src/components/admin/AdminLayout.tsx`
- Create: `frontend/src/components/admin/AdminSidebar.tsx`
- Create: `frontend/src/components/admin/AdminHeader.tsx`
- Create: `frontend/src/components/admin/StatCard.tsx`

- [ ] **Step 1: Create AdminSidebar**

Create `frontend/src/components/admin/AdminSidebar.tsx`:

```typescript
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function AdminSidebar() {
  const location = useLocation()
  const { logout } = useAuthStore()

  const menuItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Produtos', path: '/admin/produtos' },
    { label: 'Categorias', path: '/admin/categorias' },
    { label: 'Pedidos', path: '/admin/pedidos' },
    { label: 'Promoções', path: '/admin/promocoes' },
    { label: 'Clientes Newsletter', path: '/admin/newsletter' },
    { label: 'Configurações', path: '/admin/configuracoes' }
  ]

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-ink-800 text-white h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-ink-700">
        <h1 className="text-2xl font-bold text-lilac-400">Frésia Admin</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-lilac-500 text-white'
                    : 'hover:bg-ink-700'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-ink-700">
        <Button
          onClick={() => logout()}
          className="w-full bg-petal-400 hover:bg-petal-500 text-white"
        >
          Sair
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create AdminHeader**

Create `frontend/src/components/admin/AdminHeader.tsx`:

```typescript
import { useAuthStore } from '@/store/authStore'

interface AdminHeaderProps {
  title: string
  description?: string
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const user = useAuthStore(state => state.user)

  return (
    <div className="bg-white border-b border-ink-200 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">{title}</h1>
          {description && (
            <p className="text-ink-600 mt-1">{description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-ink-600">Bem-vindo,</p>
          <p className="font-semibold text-ink-800">{user?.name}</p>
          <p className="text-xs text-ink-500">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create StatCard**

Create `frontend/src/components/admin/StatCard.tsx`:

```typescript
import { Card } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon
}: StatCardProps) {
  const isPositive = change && change >= 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-ink-800">{value}</p>

          {change !== undefined && (
            <p
              className={`text-sm mt-2 ${
                isPositive ? 'text-leaf-500' : 'text-petal-400'
              }`}
            >
              {isPositive ? '↑' : '↓'} {Math.abs(change)}% {changeLabel}
            </p>
          )}
        </div>

        {icon && (
          <div className="text-4xl opacity-20">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Create AdminLayout**

Create `frontend/src/components/admin/AdminLayout.tsx`:

```typescript
import { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  description?: string
}

export function AdminLayout({
  children,
  title,
  description
}: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-ink-50">
      <AdminSidebar />

      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <AdminHeader title={title} description={description} />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/admin/AdminSidebar.tsx \
        frontend/src/components/admin/AdminHeader.tsx \
        frontend/src/components/admin/StatCard.tsx \
        frontend/src/components/admin/AdminLayout.tsx
git commit -m "feat: add admin layout components (sidebar, header, stat card)"
```

---

### Task 11: Create DataTable Component (Reusable Advanced Table)

**Files:**
- Create: `frontend/src/components/admin/DataTable.tsx`

- [ ] **Step 1: Create DataTable**

Create `frontend/src/components/admin/DataTable.tsx`:

```typescript
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  onSelect?: (selected: T[]) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  title?: string
  searchPlaceholder?: string
  onBatchDelete?: (items: T[]) => Promise<void>
  onExportCSV?: () => void
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  pageSize = 10,
  onSelect,
  onEdit,
  onDelete,
  title,
  searchPlaceholder,
  onBatchDelete,
  onExportCSV
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDesc, setSortDesc] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set())

  // Filter
  const filtered = useMemo(() => {
    if (!search) return data

    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key]
        return String(value).toLowerCase().includes(search.toLowerCase())
      })
    )
  }, [data, search, columns])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDesc ? bVal - aVal : aVal - bVal
      }

      return sortDesc
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal))
    })

    return sorted
  }, [filtered, sortKey, sortDesc])

  // Paginate
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const totalPages = Math.ceil(sorted.length / pageSize)

  const handleToggleRow = (id: number | string) => {
    const newSet = new Set(selectedRows)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedRows(newSet)
    if (onSelect) {
      onSelect(data.filter(row => newSet.has(row.id)))
    }
  }

  const handleToggleAll = () => {
    const newSet = selectedRows.size === paged.length ? new Set() : new Set()
    if (newSet.size === 0) {
      paged.forEach(row => newSet.add(row.id))
    }
    setSelectedRows(newSet)
    if (onSelect) {
      onSelect(data.filter(row => newSet.has(row.id)))
    }
  }

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortKey(key)
      setSortDesc(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || searchPlaceholder || onBatchDelete || onExportCSV) && (
        <div className="flex justify-between items-center">
          <div>
            {title && <h2 className="text-xl font-bold text-ink-800">{title}</h2>}
          </div>
          <div className="flex gap-2">
            {searchPlaceholder && (
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-48"
              />
            )}
            {selectedRows.size > 0 && onBatchDelete && (
              <Button
                onClick={() =>
                  onBatchDelete(data.filter(row => selectedRows.has(row.id)))
                }
                className="bg-petal-400 hover:bg-petal-500 text-white"
              >
                Deletar {selectedRows.size}
              </Button>
            )}
            {onExportCSV && (
              <Button
                onClick={onExportCSV}
                className="bg-leaf-500 hover:bg-leaf-600 text-white"
              >
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink-100 border-b border-ink-200">
            <tr>
              {/* Checkbox */}
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paged.length && paged.length > 0}
                  onChange={handleToggleAll}
                  className="cursor-pointer"
                />
              </th>

              {/* Column Headers */}
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left text-sm font-semibold text-ink-700 cursor-pointer hover:bg-ink-200"
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-2">{sortDesc ? '▼' : '▲'}</span>
                  )}
                </th>
              ))}

              {/* Actions */}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-ink-700">
                  Ações
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {paged.map(row => (
              <tr
                key={row.id}
                className="border-b border-ink-100 hover:bg-ink-50"
              >
                {/* Checkbox */}
                <td className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => handleToggleRow(row.id)}
                    className="cursor-pointer"
                  />
                </td>

                {/* Data */}
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    className="px-6 py-4 text-sm text-ink-700"
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}

                {/* Actions */}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 text-sm flex gap-2">
                    {onEdit && (
                      <Button
                        size="sm"
                        onClick={() => onEdit(row)}
                        className="bg-lilac-500 hover:bg-lilac-600"
                      >
                        Editar
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        onClick={() => onDelete(row)}
                        className="bg-petal-400 hover:bg-petal-500"
                      >
                        Deletar
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {paged.length === 0 && (
          <div className="p-8 text-center text-ink-500">
            Nenhum resultado encontrado
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
          >
            ← Anterior
          </Button>

          <span className="text-sm text-ink-600">
            Página {page} de {totalPages}
          </span>

          <Button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            variant="outline"
          >
            Próxima →
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/admin/DataTable.tsx
git commit -m "feat: add reusable DataTable component with filtering, sorting, pagination, batch actions"
```

---

### Task 12: Create Dashboard Overview Page

**Files:**
- Create: `frontend/src/pages/admin/AdminDashboard.tsx`
- Create: `frontend/src/services/adminStatsService.ts`
- Create: `frontend/src/hooks/useStats.ts`

- [ ] **Step 1: Create stats service**

Create `frontend/src/services/adminStatsService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

// Add auth token
api.interceptors.request.use(config => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1]

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const adminStatsService = {
  getOverviewStats: async () => {
    const { data } = await api.get('/admin/stats/overview')
    return data
  },

  getSalesChart: async (days: number = 30) => {
    const { data } = await api.get('/admin/stats/sales-chart', { params: { days } })
    return data
  },

  getRevenueByCategory: async () => {
    const { data } = await api.get('/admin/stats/revenue-by-category')
    return data
  },

  getTopProducts: async (limit: number = 5) => {
    const { data } = await api.get('/admin/stats/top-products', { params: { limit } })
    return data
  },

  getOrdersStatus: async () => {
    const { data } = await api.get('/admin/stats/orders-status')
    return data
  }
}
```

- [ ] **Step 2: Create useStats hook**

Create `frontend/src/hooks/useStats.ts`:

```typescript
import { useState, useEffect } from 'react'
import { adminStatsService } from '@/services/adminStatsService'

export function useStats() {
  const [overview, setOverview] = useState(null)
  const [salesChart, setSalesChart] = useState([])
  const [revenueByCategory, setRevenueByCategory] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [ordersStatus, setOrdersStatus] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        const [overview, chart, category, products, status] = await Promise.all([
          adminStatsService.getOverviewStats(),
          adminStatsService.getSalesChart(),
          adminStatsService.getRevenueByCategory(),
          adminStatsService.getTopProducts(),
          adminStatsService.getOrdersStatus()
        ])

        setOverview(overview)
        setSalesChart(chart)
        setRevenueByCategory(category)
        setTopProducts(products)
        setOrdersStatus(status)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  return {
    overview,
    salesChart,
    revenueByCategory,
    topProducts,
    ordersStatus,
    isLoading,
    error
  }
}
```

- [ ] **Step 3: Create chart components (minimal)**

Create `frontend/src/components/admin/ChartLine.tsx`:

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartLineProps {
  data: any[]
}

export function ChartLine({ data }: ChartLineProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke="#9b83e6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

Create `frontend/src/components/admin/ChartPie.tsx`:

```typescript
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#9b83e6', '#f5a98c', '#5a9e68', '#f59e0b', '#06b6d4']

interface ChartPieProps {
  data: any[]
}

export function ChartPie({ data }: ChartPieProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

Create `frontend/src/components/admin/ChartBar.tsx`:

```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartBarProps {
  data: any[]
}

export function ChartBar({ data }: ChartBarProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={190} />
        <Tooltip />
        <Legend />
        <Bar dataKey="quantity" fill="#9b83e6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

Create `frontend/src/components/admin/ChartDonut.tsx`:

```typescript
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444']

interface ChartDonutProps {
  data: any[]
}

export function ChartDonut({ data }: ChartDonutProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Create AdminDashboard page**

Create `frontend/src/pages/admin/AdminDashboard.tsx`:

```typescript
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatCard } from '@/components/admin/StatCard'
import { ChartLine } from '@/components/admin/ChartLine'
import { ChartPie } from '@/components/admin/ChartPie'
import { ChartBar } from '@/components/admin/ChartBar'
import { ChartDonut } from '@/components/admin/ChartDonut'
import { Card } from '@/components/ui/card'
import { useStats } from '@/hooks/useStats'

export function AdminDashboard() {
  const {
    overview,
    salesChart,
    revenueByCategory,
    topProducts,
    ordersStatus,
    isLoading,
    error
  } = useStats()

  if (error) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da loja">
        <div className="p-8 text-center text-red-600">{error}</div>
      </AdminLayout>
    )
  }

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" description="Visão geral da loja">
        <div className="p-8 text-center">Carregando...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard" description="Visão geral da loja">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total de Vendas"
          value={`R$ ${overview?.totalSales.toFixed(2) || 0}`}
          change={overview?.salesChange}
          changeLabel="vs mês anterior"
          icon="💰"
        />
        <StatCard
          label="Total de Pedidos"
          value={overview?.totalOrders || 0}
          change={overview?.ordersChange}
          changeLabel="vs mês anterior"
          icon="📦"
        />
        <StatCard
          label="Clientes Ativos"
          value={overview?.activeCustomers || 0}
          icon="👥"
        />
        <StatCard
          label="Estoque Baixo"
          value={overview?.lowStockProducts || 0}
          icon="⚠️"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-4">Vendas (30 dias)</h3>
          <ChartLine data={salesChart} />
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-4">Receita por Categoria</h3>
          <ChartPie data={revenueByCategory} />
        </Card>

        {/* Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-4">Top 5 Produtos</h3>
          <ChartBar data={topProducts} />
        </Card>

        {/* Donut Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-4">Status dos Pedidos</h3>
          <ChartDonut data={ordersStatus} />
        </Card>
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 5: Update App.tsx with admin routes**

In `frontend/src/App.tsx`, add:

```typescript
import { AdminDashboard } from '@/pages/admin/AdminDashboard'

// Inside routes:
<Route path="/admin" element={<AdminDashboard />} />
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/adminStatsService.ts \
        frontend/src/hooks/useStats.ts \
        frontend/src/components/admin/ChartLine.tsx \
        frontend/src/components/admin/ChartPie.tsx \
        frontend/src/components/admin/ChartBar.tsx \
        frontend/src/components/admin/ChartDonut.tsx \
        frontend/src/pages/admin/AdminDashboard.tsx \
        frontend/src/App.tsx
git commit -m "feat: implement admin dashboard with stats cards and charts"
```

---

### Phase 4: CRUD Operations (8 tasks)

### Task 13: Implement Products CRUD Backend

**Files:**
- Create: `backend/src/services/adminProductService.ts`
- Create: `backend/src/controllers/adminProductController.ts`

- [ ] **Step 1: Create product service**

Create `backend/src/services/adminProductService.ts`:

```typescript
import { prisma } from '@/prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

interface ProductCreateInput {
  name: string
  description?: string
  categoryId: number
  price: number
  stock: number
  isActive: boolean
  images: string[]
}

class AdminProductService {
  async getAll(
    page: number = 1,
    pageSize: number = 10,
    category?: string,
    search?: string,
    priceMin?: number,
    priceMax?: number,
    status?: string
  ) {
    const skip = (page - 1) * pageSize
    const where: any = {}

    if (category) where.categoryId = parseInt(category)
    if (search) where.name = { contains: search }
    if (priceMin) where.price = { gte: new Decimal(priceMin) }
    if (priceMax) {
      where.price = { ...where.price, lte: new Decimal(priceMax) }
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return {
      data: data.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price.toString()),
        stock: p.stock,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        isActive: p.isActive,
        images: p.images,
        slug: p.slug
      })),
      pagination: { page, pageSize, total }
    }
  }

  async getById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    })

    if (!product) throw new Error('Produto não encontrado')

    return {
      ...product,
      price: parseFloat(product.price.toString())
    }
  }

  async create(input: ProductCreateInput) {
    const existing = await prisma.product.findUnique({
      where: { slug: input.name.toLowerCase().replace(/\s+/g, '-') }
    })

    if (existing) throw new Error('Produto com este nome já existe')

    return prisma.product.create({
      data: {
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        description: input.description,
        price: new Decimal(input.price),
        stock: input.stock,
        categoryId: input.categoryId,
        isActive: input.isActive,
        images: input.images
      }
    })
  }

  async update(id: number, input: Partial<ProductCreateInput>) {
    const updateData: any = {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      price: input.price ? new Decimal(input.price) : undefined,
      stock: input.stock,
      isActive: input.isActive,
      images: input.images
    }

    Object.keys(updateData).forEach(
      k => updateData[k] === undefined && delete updateData[k]
    )

    return prisma.product.update({
      where: { id },
      data: updateData
    })
  }

  async delete(id: number) {
    await prisma.product.delete({ where: { id } })
  }

  async batchDelete(ids: number[]) {
    await prisma.product.deleteMany({
      where: { id: { in: ids } }
    })
  }
}

export const adminProductService = new AdminProductService()
```

- [ ] **Step 2: Create product controller**

Create `backend/src/controllers/adminProductController.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { adminProductService } from '@/services/adminProductService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

router.get('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = await adminProductService.getAll(
      page,
      pageSize,
      req.query.category as string,
      req.query.search as string,
      req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      req.query.status as string
    )
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar produtos' })
  }
})

router.get('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await adminProductService.getById(parseInt(req.params.id))
    return res.json(product)
  } catch (err: any) {
    return res.status(404).json({ error: err.message })
  }
})

router.post('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await adminProductService.create(req.body)
    return res.status(201).json(product)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await adminProductService.update(
      parseInt(req.params.id),
      req.body
    )
    return res.json(product)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    await adminProductService.delete(parseInt(req.params.id))
    return res.status(204).send()
  } catch (err) {
    return res.status(404).json({ error: 'Produto não encontrado' })
  }
})

router.post('/batch-delete', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body
    await adminProductService.batchDelete(ids)
    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao deletar produtos' })
  }
})

export const adminProductController = router
```

- [ ] **Step 3: Register routes in server.ts**

In `backend/src/server.ts`, add:

```typescript
import { adminProductController } from '@/controllers/adminProductController'

app.use('/api/v1/admin/products', adminProductController)
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/adminProductService.ts \
        backend/src/controllers/adminProductController.ts \
        backend/src/server.ts
git commit -m "feat: implement product CRUD backend with filtering and batch delete"
```

---

### Task 14: Implement Products CRUD Frontend

**Files:**
- Create: `frontend/src/pages/admin/products/ProductList.tsx`
- Create: `frontend/src/pages/admin/products/ProductForm.tsx`
- Create: `frontend/src/services/adminProductService.ts`
- Create: `frontend/src/hooks/useAdminProducts.ts`

- [ ] **Step 1: Create admin product service**

Create `frontend/src/services/adminProductService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

api.interceptors.request.use(config => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1]
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminProductService = {
  getAll: async (page = 1, pageSize = 10, filters = {}) => {
    const { data } = await api.get('/admin/products', {
      params: { page, pageSize, ...filters }
    })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/admin/products/${id}`)
    return data
  },

  create: async (payload: any) => {
    const { data } = await api.post('/admin/products', payload)
    return data
  },

  update: async (id: number, payload: any) => {
    const { data } = await api.put(`/admin/products/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/admin/products/${id}`)
  },

  batchDelete: async (ids: number[]) => {
    await api.post('/admin/products/batch-delete', { ids })
  }
}
```

- [ ] **Step 2: Create useAdminProducts hook**

Create `frontend/src/hooks/useAdminProducts.ts`:

```typescript
import { useState, useCallback } from 'react'
import { adminProductService } from '@/services/adminProductService'

export function useAdminProducts() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const loadProducts = useCallback(
    async (page = 1, pageSize = 10, filters = {}) => {
      try {
        setIsLoading(true)
        const result = await adminProductService.getAll(page, pageSize, filters)
        setProducts(result.data)
        setPagination(result.pagination)
      } catch (err) {
        console.error('Erro ao carregar produtos:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const deleteProduct = useCallback(async (id: number) => {
    await adminProductService.delete(id)
    setProducts(prev => prev.filter((p: any) => p.id !== id))
  }, [])

  const batchDelete = useCallback(async (ids: number[]) => {
    await adminProductService.batchDelete(ids)
    setProducts(prev => prev.filter((p: any) => !ids.includes(p.id)))
  }, [])

  return {
    products,
    pagination,
    isLoading,
    loadProducts,
    deleteProduct,
    batchDelete
  }
}
```

- [ ] **Step 3: Create ProductList page**

Create `frontend/src/pages/admin/products/ProductList.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useAdminProducts } from '@/hooks/useAdminProducts'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  categoryName: string
  isActive: boolean
}

export function ProductList() {
  const navigate = useNavigate()
  const { products, pagination, isLoading, loadProducts, deleteProduct, batchDelete } =
    useAdminProducts()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    loadProducts(page, 10, filters).catch(() => {
      toast.error('Erro ao carregar produtos')
    })
  }, [page, filters, loadProducts])

  const handleEdit = (product: Product) => {
    navigate(`/admin/produtos/${product.id}`)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Deletar "${product.name}"?`)) return
    try {
      await deleteProduct(product.id)
      toast.success('Produto deletado')
    } catch {
      toast.error('Erro ao deletar')
    }
  }

  const handleBatchDelete = async (selected: Product[]) => {
    if (!confirm(`Deletar ${selected.length} produtos?`)) return
    try {
      await batchDelete(selected.map(p => p.id))
      toast.success(`${selected.length} produtos deletados`)
    } catch {
      toast.error('Erro ao deletar')
    }
  }

  return (
    <AdminLayout title="Produtos" description="Gerencie todos os produtos da loja">
      <div className="mb-6 flex justify-between items-center">
        <div></div>
        <Button
          onClick={() => navigate('/admin/produtos/novo')}
          className="bg-lilac-500 hover:bg-lilac-600"
        >
          + Novo Produto
        </Button>
      </div>

      <DataTable<Product>
        data={products}
        columns={[
          { key: 'name', label: 'Nome', sortable: true, filterable: true },
          {
            key: 'price',
            label: 'Preço',
            sortable: true,
            render: (value: number) => `R$ ${value.toFixed(2)}`
          },
          { key: 'stock', label: 'Estoque', sortable: true },
          { key: 'categoryName', label: 'Categoria', sortable: true },
          {
            key: 'isActive',
            label: 'Status',
            render: (value: boolean) => (value ? '✓ Ativo' : '✗ Inativo')
          }
        ]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBatchDelete={handleBatchDelete}
        title="Tabela de Produtos"
        searchPlaceholder="Buscar por nome..."
      />
    </AdminLayout>
  )
}
```

- [ ] **Step 4: Create ProductForm page**

Create `frontend/src/pages/admin/products/ProductForm.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminProductService } from '@/services/adminProductService'
import { homeService } from '@/services/homeService'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  categoryId: z.number().min(1, 'Categoria obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que 0'),
  stock: z.number().min(0, 'Estoque deve ser >= 0'),
  isActive: z.boolean(),
  images: z.array(z.string()).min(1, 'Mínimo 1 imagem')
})

type ProductForm = z.infer<typeof schema>

export function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(!!id)

  const { register, handleSubmit, formState: { errors }, reset } =
    useForm<ProductForm>({
      resolver: zodResolver(schema)
    })

  useEffect(() => {
    homeService.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (id) {
      adminProductService
        .getById(parseInt(id))
        .then(product => {
          reset(product)
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, reset])

  const onSubmit = async (data: ProductForm) => {
    try {
      if (id) {
        await adminProductService.update(parseInt(id), data)
        toast.success('Produto atualizado')
      } else {
        await adminProductService.create(data)
        toast.success('Produto criado')
      }
      navigate('/admin/produtos')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  if (isLoading) return <AdminLayout title="Carregando..."><div>Carregando...</div></AdminLayout>

  return (
    <AdminLayout
      title={id ? 'Editar Produto' : 'Novo Produto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Nome *</label>
          <Input {...register('name')} />
          {errors.name && <span className="text-red-600 text-sm">{errors.name.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Descrição</label>
          <textarea
            {...register('description')}
            className="w-full border border-ink-200 rounded-lg p-3"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Categoria *</label>
            <select
              {...register('categoryId', { valueAsNumber: true })}
              className="w-full border border-ink-200 rounded-lg p-2"
            >
              <option value="">Selecione...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <span className="text-red-600 text-sm">{errors.categoryId.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Preço *</label>
            <Input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
            />
            {errors.price && (
              <span className="text-red-600 text-sm">{errors.price.message}</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Estoque *</label>
          <Input
            {...register('stock', { valueAsNumber: true })}
            type="number"
          />
          {errors.stock && (
            <span className="text-red-600 text-sm">{errors.stock.message}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            <input {...register('isActive')} type="checkbox" /> Ativo
          </label>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-lilac-500 hover:bg-lilac-600"
          >
            Salvar
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/admin/produtos')}
            variant="outline"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}
```

- [ ] **Step 5: Add routes in App.tsx**

In `frontend/src/App.tsx`, add:

```typescript
import { ProductList } from '@/pages/admin/products/ProductList'
import { ProductFormPage } from '@/pages/admin/products/ProductForm'

<Route path="/admin/produtos" element={<ProductList />} />
<Route path="/admin/produtos/novo" element={<ProductFormPage />} />
<Route path="/admin/produtos/:id" element={<ProductFormPage />} />
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/products/ \
        frontend/src/services/adminProductService.ts \
        frontend/src/hooks/useAdminProducts.ts \
        frontend/src/App.tsx
git commit -m "feat: implement products CRUD frontend with list and form"
```

---

### Task 15: Implement Categories CRUD

**Files:**
- Create: `backend/src/services/adminCategoryService.ts`
- Create: `backend/src/controllers/adminCategoryController.ts`
- Create: `frontend/src/pages/admin/categories/CategoryList.tsx`
- Create: `frontend/src/services/adminCategoryService.ts`

- [ ] **Step 1: Create backend category service**

Create `backend/src/services/adminCategoryService.ts`:

```typescript
import { prisma } from '@/prisma/client'

class AdminCategoryService {
  async getAll(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: pageSize,
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.count()
    ])

    return {
      data: data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products
      })),
      pagination: { page, pageSize, total }
    }
  }

  async getById(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    })

    if (!category) throw new Error('Categoria não encontrada')

    return category
  }

  async create(data: { name: string; description?: string }) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.name.toLowerCase().replace(/\s+/g, '-') }
    })

    if (existing) throw new Error('Categoria com este nome já existe')

    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description
      }
    })
  }

  async update(
    id: number,
    data: Partial<{ name: string; description: string }>
  ) {
    return prisma.category.update({
      where: { id },
      data
    })
  }

  async delete(id: number) {
    // Check if category has products
    const count = await prisma.product.count({
      where: { categoryId: id }
    })

    if (count > 0) throw new Error('Categoria tem produtos associados')

    await prisma.category.delete({ where: { id } })
  }
}

export const adminCategoryService = new AdminCategoryService()
```

- [ ] **Step 2: Create backend category controller**

Create `backend/src/controllers/adminCategoryController.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { adminCategoryService } from '@/services/adminCategoryService'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

router.get('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = await adminCategoryService.getAll(page, pageSize)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

router.post('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const category = await adminCategoryService.create(req.body)
    return res.status(201).json(category)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const category = await adminCategoryService.update(
      parseInt(req.params.id),
      req.body
    )
    return res.json(category)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    await adminCategoryService.delete(parseInt(req.params.id))
    return res.status(204).send()
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export const adminCategoryController = router
```

- [ ] **Step 3: Register backend routes**

In `backend/src/server.ts`:

```typescript
import { adminCategoryController } from '@/controllers/adminCategoryController'

app.use('/api/v1/admin/categories', adminCategoryController)
```

- [ ] **Step 4: Create frontend category service**

Create `frontend/src/services/adminCategoryService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

api.interceptors.request.use(config => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1]
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminCategoryService = {
  getAll: async (page = 1, pageSize = 10) => {
    const { data } = await api.get('/admin/categories', {
      params: { page, pageSize }
    })
    return data
  },

  create: async (payload: any) => {
    const { data } = await api.post('/admin/categories', payload)
    return data
  },

  update: async (id: number, payload: any) => {
    const { data } = await api.put(`/admin/categories/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/admin/categories/${id}`)
  }
}
```

- [ ] **Step 5: Create frontend CategoryList page**

Create `frontend/src/pages/admin/categories/CategoryList.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminCategoryService } from '@/services/adminCategoryService'
import { toast } from 'sonner'

interface Category {
  id: number
  name: string
  productCount: number
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const result = await adminCategoryService.getAll(page, 10)
      setCategories(result.data)
    } catch (err) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [page])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Nome obrigatório')
      return
    }
    try {
      await adminCategoryService.create({ name: newName })
      toast.success('Categoria criada')
      setNewName('')
      setShowNewForm(false)
      loadCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar')
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      toast.error('Nome obrigatório')
      return
    }
    try {
      await adminCategoryService.update(id, { name: editName })
      toast.success('Categoria atualizada')
      setEditingId(null)
      loadCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Deletar categoria?')) return
    try {
      await adminCategoryService.delete(id)
      toast.success('Categoria deletada')
      loadCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao deletar')
    }
  }

  if (isLoading) return <AdminLayout title="Categorias"><div>Carregando...</div></AdminLayout>

  return (
    <AdminLayout title="Categorias">
      {showNewForm && (
        <div className="mb-6 p-4 border border-lilac-200 rounded-lg">
          <Input
            placeholder="Nome da categoria"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              className="bg-lilac-500 hover:bg-lilac-600"
            >
              Salvar
            </Button>
            <Button
              onClick={() => {
                setShowNewForm(false)
                setNewName('')
              }}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!showNewForm && (
        <div className="mb-6">
          <Button
            onClick={() => setShowNewForm(true)}
            className="bg-lilac-500 hover:bg-lilac-600"
          >
            + Nova Categoria
          </Button>
        </div>
      )}

      <DataTable<Category>
        data={categories}
        columns={[
          { key: 'name', label: 'Nome', sortable: true },
          { key: 'productCount', label: 'Produtos', sortable: true }
        ]}
        pageSize={10}
        onEdit={(cat) => {
          setEditingId(cat.id)
          setEditName(cat.name)
        }}
        onDelete={cat => handleDelete(cat.id)}
      />

      {editingId && (
        <div className="mt-6 p-4 border border-lilac-200 rounded-lg max-w-md">
          <h3 className="font-semibold mb-3">Editar Categoria</h3>
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleUpdate(editingId)}
              className="bg-lilac-500 hover:bg-lilac-600"
            >
              Atualizar
            </Button>
            <Button
              onClick={() => setEditingId(null)}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
```

- [ ] **Step 6: Add route in App.tsx**

```typescript
import { CategoryList } from '@/pages/admin/categories/CategoryList'

<Route path="/admin/categorias" element={<CategoryList />} />
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/adminCategoryService.ts \
        backend/src/controllers/adminCategoryController.ts \
        frontend/src/pages/admin/categories/CategoryList.tsx \
        frontend/src/services/adminCategoryService.ts \
        backend/src/server.ts \
        frontend/src/App.tsx
git commit -m "feat: implement categories CRUD backend and frontend"
```

---

### Task 16: Implement Promotions CRUD (separate create/edit pages)

**Files:**
- Create: `frontend/src/pages/admin/promotions/PromotionList.tsx`
- Create: `frontend/src/pages/admin/promotions/PromotionForm.tsx`
- Create: `frontend/src/services/adminPromotionService.ts` (frontend)
- Create: `frontend/src/hooks/useAdminPromotions.ts`

- [ ] **Step 1: Create frontend promotion service**

Create `frontend/src/services/adminPromotionService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

api.interceptors.request.use(config => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1]
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminPromotionService = {
  getAll: async (page = 1, pageSize = 10, status?: string, search?: string) => {
    const { data } = await api.get('/admin/promotions', {
      params: { page, pageSize, status, search }
    })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/admin/promotions/${id}`)
    return data
  },

  create: async (payload: any) => {
    const { data } = await api.post('/admin/promotions', payload)
    return data
  },

  update: async (id: number, payload: any) => {
    const { data } = await api.put(`/admin/promotions/${id}`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/admin/promotions/${id}`)
  }
}
```

- [ ] **Step 2: Create useAdminPromotions hook**

Create `frontend/src/hooks/useAdminPromotions.ts`:

```typescript
import { useState, useCallback } from 'react'
import { adminPromotionService } from '@/services/adminPromotionService'

export function useAdminPromotions() {
  const [promotions, setPromotions] = useState([])
  const [pagination, setPagination] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const loadPromotions = useCallback(
    async (page = 1, pageSize = 10, status?: string, search?: string) => {
      try {
        setIsLoading(true)
        const result = await adminPromotionService.getAll(
          page,
          pageSize,
          status,
          search
        )
        setPromotions(result.data)
        setPagination(result.pagination)
      } catch (err) {
        console.error('Erro ao carregar promoções:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const deletePromotion = useCallback(async (id: number) => {
    await adminPromotionService.delete(id)
    setPromotions(prev => prev.filter((p: any) => p.id !== id))
  }, [])

  return {
    promotions,
    pagination,
    isLoading,
    loadPromotions,
    deletePromotion
  }
}
```

- [ ] **Step 3: Create PromotionList page**

Create `frontend/src/pages/admin/promotions/PromotionList.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useAdminPromotions } from '@/hooks/useAdminPromotions'
import { toast } from 'sonner'

interface Promotion {
  id: number
  name: string
  discountValue: number
  discountType: string
  status: string
  productCount: number
  validFrom: string
  validTo: string
}

export function PromotionList() {
  const navigate = useNavigate()
  const { promotions, pagination, isLoading, loadPromotions, deletePromotion } =
    useAdminPromotions()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadPromotions(page, 10, statusFilter || undefined).catch(() => {
      toast.error('Erro ao carregar promoções')
    })
  }, [page, statusFilter, loadPromotions])

  const handleEdit = (promotion: Promotion) => {
    navigate(`/admin/promocoes/${promotion.id}`)
  }

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Deletar promoção "${promotion.name}"?`)) return
    try {
      await deletePromotion(promotion.id)
      toast.success('Promoção deletada')
      loadPromotions(page, 10, statusFilter || undefined)
    } catch {
      toast.error('Erro ao deletar')
    }
  }

  return (
    <AdminLayout
      title="Promoções"
      description="Gerencie promoções e descontos"
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="border border-ink-200 rounded-lg p-2"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativa</option>
            <option value="expired">Expirada</option>
            <option value="inactive">Inativa</option>
          </select>
        </div>
        <Button
          onClick={() => navigate('/admin/promocoes/nova')}
          className="bg-lilac-500 hover:bg-lilac-600"
        >
          + Nova Promoção
        </Button>
      </div>

      <DataTable<Promotion>
        data={promotions}
        columns={[
          { key: 'name', label: 'Nome', sortable: true, filterable: true },
          {
            key: 'discountValue',
            label: 'Desconto',
            render: (value: number, row: Promotion) =>
              row.discountType === 'percentage'
                ? `${value}%`
                : `R$ ${value.toFixed(2)}`
          },
          { key: 'productCount', label: 'Produtos', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          {
            key: 'validFrom',
            label: 'Válido de',
            render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
          }
        ]}
        pageSize={10}
        onEdit={handleEdit}
        onDelete={handleDelete}
        title="Tabela de Promoções"
        searchPlaceholder="Buscar por nome..."
      />
    </AdminLayout>
  )
}
```

- [ ] **Step 4: Create PromotionForm page**

Create `frontend/src/pages/admin/promotions/PromotionForm.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminPromotionService } from '@/services/adminPromotionService'
import { adminProductService } from '@/services/adminProductService'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'Tipo de desconto inválido' })
  }),
  discountValue: z.number().min(0.01, 'Desconto deve ser maior que 0'),
  validFrom: z.string().min(1, 'Data início obrigatória'),
  validTo: z.string().min(1, 'Data fim obrigatória'),
  isActive: z.boolean(),
  productIds: z.array(z.number()).min(1, 'Mínimo 1 produto')
})

type PromotionForm = z.infer<typeof schema>

export function PromotionFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(!!id)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())

  const { register, handleSubmit, formState: { errors }, reset, control } =
    useForm<PromotionForm>({
      resolver: zodResolver(schema),
      defaultValues: { discountType: 'percentage', isActive: true, productIds: [] }
    })

  useEffect(() => {
    adminProductService
      .getAll(1, 100, {})
      .then(result => setProducts(result.data))
  }, [])

  useEffect(() => {
    if (id) {
      adminPromotionService
        .getById(parseInt(id))
        .then(promo => {
          reset({
            name: promo.name,
            description: promo.description,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            validFrom: promo.validFrom.split('T')[0],
            validTo: promo.validTo.split('T')[0],
            isActive: promo.isActive,
            productIds: promo.productIds
          })
          setSelectedProducts(new Set(promo.productIds))
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, reset])

  const onSubmit = async (data: PromotionForm) => {
    if (selectedProducts.size === 0) {
      toast.error('Selecione pelo menos 1 produto')
      return
    }

    const payload = {
      ...data,
      productIds: Array.from(selectedProducts),
      validFrom: new Date(data.validFrom),
      validTo: new Date(data.validTo)
    }

    try {
      if (id) {
        await adminPromotionService.update(parseInt(id), payload)
        toast.success('Promoção atualizada')
      } else {
        await adminPromotionService.create(payload)
        toast.success('Promoção criada')
      }
      navigate('/admin/promocoes')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  const toggleProduct = (productId: number) => {
    const newSet = new Set(selectedProducts)
    if (newSet.has(productId)) {
      newSet.delete(productId)
    } else {
      newSet.add(productId)
    }
    setSelectedProducts(newSet)
  }

  if (isLoading) return <AdminLayout title="Carregando..."><div>Carregando...</div></AdminLayout>

  return (
    <AdminLayout title={id ? 'Editar Promoção' : 'Nova Promoção'}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Nome *</label>
          <Input {...register('name')} />
          {errors.name && (
            <span className="text-red-600 text-sm">{errors.name.message}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Descrição</label>
          <textarea
            {...register('description')}
            className="w-full border border-ink-200 rounded-lg p-3"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Tipo *</label>
            <select
              {...register('discountType')}
              className="w-full border border-ink-200 rounded-lg p-2"
            >
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Valor *</label>
            <Input
              {...register('discountValue', { valueAsNumber: true })}
              type="number"
              step="0.01"
            />
            {errors.discountValue && (
              <span className="text-red-600 text-sm">
                {errors.discountValue.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Ativo</label>
            <label className="flex items-center gap-2">
              <input {...register('isActive')} type="checkbox" />
              Sim
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Válido de *</label>
            <Input
              {...register('validFrom')}
              type="date"
            />
            {errors.validFrom && (
              <span className="text-red-600 text-sm">
                {errors.validFrom.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Válido até *</label>
            <Input
              {...register('validTo')}
              type="date"
            />
            {errors.validTo && (
              <span className="text-red-600 text-sm">
                {errors.validTo.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3">
            Produtos * ({selectedProducts.size} selecionados)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-ink-200 p-4 rounded-lg">
            {products.map((product: any) => (
              <label
                key={product.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-ink-700">{product.name}</span>
              </label>
            ))}
          </div>
          {selectedProducts.size === 0 && (
            <span className="text-red-600 text-sm">Mínimo 1 produto</span>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-lilac-500 hover:bg-lilac-600"
          >
            Salvar
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/admin/promocoes')}
            variant="outline"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}
```

- [ ] **Step 5: Add routes in App.tsx**

```typescript
import { PromotionList } from '@/pages/admin/promotions/PromotionList'
import { PromotionFormPage } from '@/pages/admin/promotions/PromotionForm'

<Route path="/admin/promocoes" element={<PromotionList />} />
<Route path="/admin/promocoes/nova" element={<PromotionFormPage />} />
<Route path="/admin/promocoes/:id" element={<PromotionFormPage />} />
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/promotions/ \
        frontend/src/services/adminPromotionService.ts \
        frontend/src/hooks/useAdminPromotions.ts \
        frontend/src/App.tsx
git commit -m "feat: implement promotions CRUD frontend with multi-select products and date range"
```

---

### Task 17: Implement Orders Management Page

**Files:**
- Create: `backend/src/routes/admin/orders.ts` (new endpoint for status update)
- Create: `frontend/src/pages/admin/orders/OrderList.tsx`
- Create: `frontend/src/services/adminOrderService.ts`
- Create: `frontend/src/hooks/useAdminOrders.ts`

- [ ] **Step 1: Create backend order status route**

Create `backend/src/routes/admin/orders.ts`:

```typescript
import { Router, Request, Response } from 'express'
import { prisma } from '@/prisma/client'
import { adminMiddleware } from '@/middlewares/adminMiddleware'

const router = Router()

const STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  confirmed: 'confirmed',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled'
}

router.get('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined

    const skip = (page - 1) * pageSize
    const where: any = {}

    if (status && status !== 'all') where.status = status
    if (search) {
      where.OR = [
        { id: { equals: parseInt(search) } },
        { user: { name: { contains: search } } }
      ]
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ])

    return res.json({
      data: data.map(order => ({
        id: order.id,
        userId: order.userId,
        clientName: order.user.name,
        clientEmail: order.user.email,
        total: parseFloat(order.total.toString()),
        status: order.status,
        createdAt: order.createdAt
      })),
      pagination: { page, pageSize, total }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar pedidos' })
  }
})

router.get('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: true,
        items: { include: { product: true } },
        neighborhood: true
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }

    return res.json({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items.map(item => ({
        ...item,
        price: parseFloat(item.price.toString())
      }))
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar pedido' })
  }
})

router.put('/:id/status', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body

    if (!STATUS_MAP[status]) {
      return res.status(400).json({ error: 'Status inválido' })
    }

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: { user: true }
    })

    return res.json({
      ...order,
      total: parseFloat(order.total.toString())
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar status' })
  }
})

export const adminOrdersController = router
```

- [ ] **Step 2: Register order route in server.ts**

In `backend/src/server.ts`:

```typescript
import { adminOrdersController } from '@/routes/admin/orders'

app.use('/api/v1/admin/orders', adminOrdersController)
```

- [ ] **Step 3: Create frontend order service**

Create `frontend/src/services/adminOrderService.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

api.interceptors.request.use(config => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1]
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminOrderService = {
  getAll: async (page = 1, pageSize = 10, status?: string, search?: string) => {
    const { data } = await api.get('/admin/orders', {
      params: { page, pageSize, status, search }
    })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/admin/orders/${id}`)
    return data
  },

  updateStatus: async (id: number, status: string) => {
    const { data } = await api.put(`/admin/orders/${id}/status`, { status })
    return data
  }
}
```

- [ ] **Step 4: Create useAdminOrders hook**

Create `frontend/src/hooks/useAdminOrders.ts`:

```typescript
import { useState, useCallback } from 'react'
import { adminOrderService } from '@/services/adminOrderService'

export function useAdminOrders() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const loadOrders = useCallback(
    async (page = 1, pageSize = 10, status?: string, search?: string) => {
      try {
        setIsLoading(true)
        const result = await adminOrderService.getAll(
          page,
          pageSize,
          status,
          search
        )
        setOrders(result.data)
        setPagination(result.pagination)
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const updateStatus = useCallback(
    async (id: number, newStatus: string) => {
      await adminOrderService.updateStatus(id, newStatus)
      setOrders(prev =>
        prev.map(o =>
          o.id === id ? { ...o, status: newStatus } : o
        )
      )
    },
    []
  )

  return {
    orders,
    pagination,
    isLoading,
    loadOrders,
    updateStatus
  }
}
```

- [ ] **Step 5: Create OrderList page**

Create `frontend/src/pages/admin/orders/OrderList.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useAdminOrders } from '@/hooks/useAdminOrders'
import { toast } from 'sonner'

interface Order {
  id: number
  clientName: string
  clientEmail: string
  total: number
  status: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-green-700 text-white',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
]

export function OrderList() {
  const { orders, pagination, isLoading, loadOrders, updateStatus } =
    useAdminOrders()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<any>(null)

  useEffect(() => {
    loadOrders(page, 10, statusFilter || undefined).catch(() => {
      toast.error('Erro ao carregar pedidos')
    })
  }, [page, statusFilter, loadOrders])

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateStatus(orderId, newStatus)
      toast.success('Status atualizado')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleViewDetail = (order: Order) => {
    setDetailOrderId(order.id)
    // In real app, fetch detail data here
    setDetailData(order)
  }

  return (
    <AdminLayout
      title="Pedidos"
      description="Gerencie pedidos e status de entrega"
    >
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="border border-ink-200 rounded-lg p-2"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable<Order>
        data={orders}
        columns={[
          { key: 'id', label: 'ID', sortable: true },
          { key: 'clientName', label: 'Cliente', sortable: true, filterable: true },
          {
            key: 'total',
            label: 'Total',
            render: (value: number) => `R$ ${value.toFixed(2)}`
          },
          {
            key: 'status',
            label: 'Status',
            render: (value: string) => (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[value] || ''}`}>
                {STATUS_LABELS[value] || value}
              </span>
            )
          },
          {
            key: 'createdAt',
            label: 'Data',
            render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
          }
        ]}
        pageSize={10}
        onEdit={handleViewDetail}
        title="Tabela de Pedidos"
      />

      {/* Detail Modal */}
      {detailOrderId && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-6">Pedido #{detailData.id}</h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-ink-600">Cliente</p>
                  <p className="font-semibold">{detailData.clientName}</p>
                  <p className="text-sm text-ink-600">{detailData.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600">Data</p>
                  <p className="font-semibold">
                    {new Date(detailData.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="border-t border-ink-200 pt-4">
                <p className="text-sm text-ink-600 mb-3">Atualizar Status</p>
                <select
                  value={detailData.status}
                  onChange={e =>
                    handleStatusChange(detailOrderId, e.target.value)
                  }
                  className="border border-ink-200 rounded-lg p-2"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setDetailOrderId(null)}
                variant="outline"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
```

- [ ] **Step 6: Add route in App.tsx**

```typescript
import { OrderList } from '@/pages/admin/orders/OrderList'

<Route path="/admin/pedidos" element={<OrderList />} />
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/admin/orders.ts \
        frontend/src/pages/admin/orders/OrderList.tsx \
        frontend/src/services/adminOrderService.ts \
        frontend/src/hooks/useAdminOrders.ts \
        backend/src/server.ts \
        frontend/src/App.tsx
git commit -m "feat: implement orders management with status filtering and update"
```

---

### Task 18: Add CSV Export to DataTable & Batch Delete Confirmation

**Files:**
- Modify: `frontend/src/components/admin/DataTable.tsx`
- Create: `frontend/src/lib/csvExport.ts`

[CSV export logic and enhanced batch delete UX - 3 steps]

---

### Task 19: Complete Form Validation (React Hook Form + Zod for all forms)

**Files:**
- Modify: `frontend/src/pages/admin/products/ProductForm.tsx` (add validation)
- Modify: `frontend/src/pages/admin/promotions/PromotionForm.tsx` (add validation)

[Add complete validation schemas and error display - 2 steps]

---

### Task 20: Add Error Handling & Loading States

**Files:**
- Modify: All API calls to include proper error handling
- Add: Toast notifications for all CRUD operations
- Add: Loading skeletons for tables

[Global error handling and toast integration - 3 steps]

---

### Task 21: Implement Newsletter Subscribers List Page

**Files:**
- Create: `frontend/src/pages/admin/newsletter/NewsletterList.tsx`

[Newsletter subscribers admin page - 3 steps]

---

### Task 22: Add Admin Testimonials Management

**Files:**
- Create: `frontend/src/pages/admin/testimonials/TestimonialList.tsx`

[Testimonials CRUD for admin - 4 steps]

---

### Task 23: E2E Tests - Home Page (Playwright/Cypress)

[Test: Hero loads, categories visible, search works, newsletter subscribes, testimonials display]

---

### Task 24: E2E Tests - Admin Dashboard

[Test: Stats load, charts render, sidebar navigation works]

---

### Task 25: E2E Tests - Admin CRUD Operations

[Test: Product CRUD, Category CRUD, Promotion CRUD, Order status update]

---

## Summary

This is a comprehensive 25-task plan for Session 8 implementing:
- ✅ Home Page (hero, categories, promos, newsletter, testimonials)
- ✅ Admin Dashboard (overview, stats cards, 4 charts, sidebar navigation)
- ✅ Products CRUD (advanced table with filtering, sorting, batch delete)
- ✅ Categories CRUD (inline edit modal)
- ✅ Promotions CRUD (date range, product multi-select)
- ✅ Orders management (status filtering, detail modal, status update)
- ✅ Newsletter subscribers list
- ✅ Testimonials management
- ✅ E2E tests

**Execution Note:**
This plan assumes you have:
- Prisma migrations running
- Existing auth middleware configured
- Admin middleware that checks `isAdmin` flag
- MySQL database with User, Product, Category, Order, OrderItem tables
- Express server with CORS enabled

Would you like to proceed with subagent-driven execution, or inline execution of these 25 tasks?
