# Session 7: Mercado Pago + Animated Card UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add animated credit card form with brand detection (Visa/Mastercard logos), CVV flip animation, and Mercado Pago payment processing. Enhance checkout finalization step with product images and full order summary.

**Architecture:** 
- Frontend: `react-credit-cards-2` provides animated card preview driven by controlled React state
- Frontend: Mercado Pago JS SDK v2 (CDN) tokenizes raw card data in-browser before submission
- Backend: Atomic order creation + payment processing via Mercado Pago Node.js SDK
- Checkout workflow: 5 steps (Entrega → Dados → Mensagem → Pagamento → Confirmação)
- Order schema: adds `paymentStatus` field to track MP payment state separately from order fulfillment

**Tech Stack:** react-credit-cards-2 (visual), @mercadopago/sdk-js v2 (CDN, tokenization), mercadopago npm (Node.js backend)

---

## Task 1: Schema Migration — Add Payment Status

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/*/add_payment_status.sql` (auto-generated)

- [ ] **Step 1: Add paymentStatus field to Order model**

Open `schema.prisma` and add the field after `paymentId`:

```prisma
model Order {
  id              Int           @id @default(autoincrement())
  userId          Int
  status          String        @default("pending")
  paymentStatus   String        @default("pending")
  total           Decimal       @db.Decimal(10, 2)
  deliveryMessage String?       @db.Text
  deliveryMethod  String        @default("motoboy")
  neighborhoodId  Int?
  customerName    String
  customerEmail   String
  customerPhone   String?
  paymentId       String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  user            User          @relation(fields: [userId], references: [id])
  neighborhood    Neighborhood? @relation(fields: [neighborhoodId], references: [id])
  items           OrderItem[]
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend
npx prisma migrate dev --name add_payment_status
```

Expected: Migration runs, new column created in MySQL.

---

## Task 2: Backend Dependencies + MP SDK Configuration

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/.env.example`
- Modify: `backend/.env`
- Create: `backend/src/lib/mercadopago.ts`

- [ ] **Step 1: Install Mercado Pago SDK**

```bash
cd backend
npm install mercadopago
```

- [ ] **Step 2: Update .env.example with MP credentials**

```bash
# backend/.env.example
DATABASE_URL="mysql://root:SENHA@localhost:3306/fresia"
JWT_SECRET=
PORT=3001
MP_ACCESS_TOKEN=APP_USR-your-access-token-here
MP_PUBLIC_KEY=TEST-your-public-key-here
```

- [ ] **Step 3: Update .env with actual MP test credentials**

Get test credentials from https://www.mercadopago.com.br/developers/panel (test mode):

```bash
# backend/.env
DATABASE_URL="mysql://root:password@localhost:3306/fresia"
JWT_SECRET=your-jwt-secret-here
PORT=3001
MP_ACCESS_TOKEN=APP_USR-xxx
MP_PUBLIC_KEY=TEST-xxx
```

- [ ] **Step 4: Create MP SDK client library**

Create `backend/src/lib/mercadopago.ts`:

```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 }
})

export const payment = new Payment(client)
```

---

## Task 3: Payment Service + Update Order Service

**Files:**
- Create: `backend/src/services/paymentService.ts`
- Modify: `backend/src/services/orderService.ts`

- [ ] **Step 1: Create paymentService.ts**

```typescript
import { payment } from '@/lib/mercadopago'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProcessPaymentInput {
  orderId: number
  cardToken: string
  paymentMethodId: string
  installments: number
  customerEmail: string
  customerPhone?: string
  cpf: string
  identificationNumber?: string
}

export const paymentService = {
  async processPayment(input: ProcessPaymentInput) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { items: true }
      })

      if (!order) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 })

      const result = await payment.create({
        body: {
          transaction_amount: parseFloat(String(order.total)),
          description: `Pedido Frésia #${order.id}`,
          payment_method_id: input.paymentMethodId,
          installments: input.installments,
          token: input.cardToken,
          payer: {
            email: input.customerEmail,
            phone: input.customerPhone ? {
              area_code: input.customerPhone.substring(0, 2),
              number: input.customerPhone.substring(2)
            } : undefined,
            identification: {
              type: 'CPF',
              number: input.cpf.replace(/\D/g, '')
            }
          }
        }
      })

      const paymentStatus = result.status === 'approved' ? 'approved' : result.status === 'pending' ? 'pending' : 'rejected'

      await prisma.order.update({
        where: { id: input.orderId },
        data: {
          paymentId: String(result.id),
          paymentStatus,
          status: paymentStatus === 'approved' ? 'confirmed' : 'pending'
        }
      })

      return { success: paymentStatus === 'approved', paymentId: result.id, status: paymentStatus }
    } catch (err: any) {
      await prisma.order.update({
        where: { id: input.orderId },
        data: { paymentStatus: 'rejected' }
      })
      throw err
    }
  }
}
```

- [ ] **Step 2: Update orderService to accept card token fields**

Modify `backend/src/services/orderService.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { paymentService } from './paymentService'

const prisma = new PrismaClient()

interface CreateOrderInput {
  userId: number
  items: { productId: number; variantId?: number | null; qty: number; price: number }[]
  neighborhoodId: number
  deliveryMethod: string
  deliveryMessage?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  cardToken?: string
  paymentMethodId?: string
  installments?: number
  cpf?: string
}

export const orderService = {
  async create(input: CreateOrderInput) {
    const neighborhood = await prisma.neighborhood.findUnique({ where: { id: input.neighborhoodId } })
    if (!neighborhood) throw Object.assign(new Error('Bairro não encontrado'), { statusCode: 404 })

    const deliveryFee = Number(neighborhood.deliveryFee)
    const itemsTotal = input.items.reduce((acc, i) => acc + i.price * i.qty, 0)
    const total = itemsTotal + deliveryFee

    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        status: 'pending',
        paymentStatus: input.cardToken ? 'processing' : 'pending',
        total,
        deliveryMessage: input.deliveryMessage,
        deliveryMethod: input.deliveryMethod,
        neighborhoodId: input.neighborhoodId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        items: {
          create: input.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            qty: i.qty,
            price: i.price,
          })),
        },
      },
      select: { id: true, status: true, paymentStatus: true, total: true },
    })

    if (input.cardToken && input.paymentMethodId && input.cpf) {
      await paymentService.processPayment({
        orderId: order.id,
        cardToken: input.cardToken,
        paymentMethodId: input.paymentMethodId,
        installments: input.installments || 1,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        cpf: input.cpf
      })
    }

    return order
  },
}
```

---

## Task 4: Payment Controller + Route + Server Registration

**Files:**
- Create: `backend/src/controllers/paymentController.ts`
- Create: `backend/src/routes/payment.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Create paymentController.ts**

```typescript
import { Request, Response, NextFunction } from 'express'
import { paymentService } from '../services/paymentService'

export const paymentController = {
  async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, cardToken, paymentMethodId, installments, cpf } = req.body
      const result = await paymentService.processPayment({
        orderId,
        cardToken,
        paymentMethodId,
        installments: installments || 1,
        customerEmail: (req as any).user.email,
        customerPhone: (req as any).user.phone,
        cpf
      })
      res.json(result)
    } catch (err) { next(err) }
  }
}
```

- [ ] **Step 2: Create payment route**

Create `backend/src/routes/payment.ts`:

```typescript
import { Router } from 'express'
import { paymentController } from '../controllers/paymentController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()
router.post('/process', authMiddleware, paymentController.processPayment)
export default router
```

- [ ] **Step 3: Register route in server.ts**

Add import and route registration:

```typescript
import paymentRouter from './routes/payment'

// Add before error handler:
app.use('/api/v1/payment', paymentRouter)
```

---

## Task 5: Frontend Dependencies + MP SDK Script

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/index.html`
- Modify: `frontend/.env`
- Modify: `frontend/.env.example`

- [ ] **Step 1: Install react-credit-cards-2**

```bash
cd frontend
npm install react-credit-cards-2
```

- [ ] **Step 2: Add MP SDK script to index.html**

In `frontend/index.html`, add before closing `</head>`:

```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

- [ ] **Step 3: Create .env for MP public key**

Add to `frontend/.env`:

```
VITE_MP_PUBLIC_KEY=TEST-your-test-public-key-here
```

Add to `frontend/.env.example`:

```
VITE_MP_PUBLIC_KEY=TEST-your-public-key-here
```

- [ ] **Step 4: Initialize MP SDK in App.tsx or main.tsx**

In `frontend/src/main.tsx`, add after imports:

```typescript
declare global {
  interface Window {
    MercadoPago: any
  }
}

if (typeof window !== 'undefined' && window.MercadoPago) {
  window.MercadoPago.configure({
    publicKey: import.meta.env.VITE_MP_PUBLIC_KEY,
    locale: 'pt-BR'
  })
}
```

---

## Task 6: Create CreditCardForm Component

**Files:**
- Create: `frontend/src/components/features/CreditCardForm.tsx`

- [ ] **Step 1: Create animated card form component**

```typescript
import { useState } from 'react'
import Cards from 'react-credit-cards-2'
import 'react-credit-cards-2/dist/index.css'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CreditCardFormProps {
  onTokenCreated: (token: string, paymentMethodId: string, cpf: string) => Promise<void>
  isLoading?: boolean
}

export function CreditCardForm({ onTokenCreated, isLoading = false }: CreditCardFormProps) {
  const [cardState, setCardState] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    focus: 'number' as 'number' | 'name' | 'expiry' | 'cvc'
  })
  const [cpf, setCpf] = useState('')
  const [installments, setInstallments] = useState('1')
  const [processingToken, setProcessingToken] = useState(false)

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardState(prev => ({ ...prev, [name]: value }))
  }

  const getCardBrand = () => {
    const number = cardState.number.replace(/\s/g, '')
    if (/^4/.test(number)) return 'visa'
    if (/^5[1-5]/.test(number)) return 'master'
    if (/^3[47]/.test(number)) return 'amex'
    if (/^30[0-5]|^36|^38|^39/.test(number)) return 'diners'
    if (/^6011|^65/.test(number)) return 'discover'
    if (/^35\d{3}/.test(number)) return 'jcb'
    return 'unknown'
  }

  const mapBrandToPaymentMethod = (brand: string) => {
    const map: Record<string, string> = {
      visa: 'visa',
      master: 'master',
      mastercard: 'master',
      amex: 'amex',
      diners: 'diners',
      discover: 'discover',
      jcb: 'jcb',
      hipercard: 'hipercard',
      elo: 'elo'
    }
    return map[brand] || 'visa'
  }

  const tokenizeCard = async () => {
    if (!window.MercadoPago) {
      alert('SDK do Mercado Pago não carregado')
      return
    }

    setProcessingToken(true)
    try {
      const [month, year] = cardState.expiry.split('/')
      const cardNumber = cardState.number.replace(/\s/g, '')
      
      const token = await window.MercadoPago.createCardToken({
        cardNumber,
        cardholderName: cardState.name,
        cardExpirationMonth: month,
        cardExpirationYear: '20' + year,
        securityCode: cardState.cvc,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, '')
      })

      const paymentMethodId = mapBrandToPaymentMethod(getCardBrand())
      await onTokenCreated(token.id, paymentMethodId, cpf)
    } catch (error: any) {
      alert('Erro ao tokenizar cartão: ' + error.message)
    } finally {
      setProcessingToken(false)
    }
  }

  const isValid = cardState.number.length >= 13 && cardState.name && cardState.expiry.length === 5 && cardState.cvc.length >= 3 && cpf.replace(/\D/g, '').length === 11

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Cards
          number={cardState.number}
          expiry={cardState.expiry}
          cvc={cardState.cvc}
          name={cardState.name}
          focused={cardState.focus}
          placeholders={{ name: 'NOME DO TITULAR' }}
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Numero do Cartao</label>
          <Input
            name="number"
            value={cardState.number}
            onChange={e => handleCardChange({ ...e, target: { ...e.target, value: e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim() } })}
            onFocus={() => setCardState(p => ({ ...p, focus: 'number' }))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Titular do Cartao</label>
          <Input
            name="name"
            value={cardState.name}
            onChange={handleCardChange}
            onFocus={() => setCardState(p => ({ ...p, focus: 'name' }))}
            placeholder="MARIA SANTOS"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Validade</label>
            <Input
              name="expiry"
              value={cardState.expiry}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2, 4)
                handleCardChange({ ...e, target: { ...e.target, value } })
              }}
              onFocus={() => setCardState(p => ({ ...p, focus: 'expiry' }))}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CVV</label>
            <Input
              name="cvc"
              value={cardState.cvc}
              onChange={e => handleCardChange({ ...e, target: { ...e.target, value: e.target.value.replace(/\D/g, '').substring(0, 4) } })}
              onFocus={() => setCardState(p => ({ ...p, focus: 'cvc' }))}
              placeholder="000"
              maxLength={4}
              type="password"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CPF</label>
          <Input
            value={cpf}
            onChange={e => {
              let value = e.target.value.replace(/\D/g, '')
              if (value.length > 3) value = value.substring(0, 3) + '.' + value.substring(3)
              if (value.length > 7) value = value.substring(0, 7) + '.' + value.substring(7)
              if (value.length > 11) value = value.substring(0, 11) + '-' + value.substring(11, 13)
              setCpf(value)
            }}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Parcelamento</label>
          <select className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-800 bg-white focus:outline-none">
            <option value="1">1x sem juros</option>
            <option value="2">2x sem juros</option>
            <option value="3">3x sem juros</option>
            <option value="6">6x com juros</option>
          </select>
        </div>
      </div>

      <Button
        className="w-full bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill"
        disabled={!isValid || processingToken || isLoading}
        onClick={tokenizeCard}
      >
        {processingToken ? 'Processando...' : 'Continuar'}
      </Button>
    </div>
  )
}
```

---

## Task 7: Refactor CheckoutPage to 5-Step Flow

**Files:**
- Modify: `frontend/src/pages/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Update STEPS array and state**

Change the STEPS constant at the top:

```typescript
const STEPS = ['Entrega', 'Dados', 'Mensagem', 'Pagamento', 'Confirmacao']
type Step = 1 | 2 | 3 | 4 | 5
```

Update state additions:

```typescript
const [cardToken, setCardToken] = useState('')
const [paymentMethodId, setPaymentMethodId] = useState('')
const [cpf, setCpf] = useState('')
```

- [ ] **Step 2: Add handleTokenCreated function**

Add after `handleFinalize`:

```typescript
const handleTokenCreated = async (token: string, paymentMethod: string, cpfValue: string) => {
  setCardToken(token)
  setPaymentMethodId(paymentMethod)
  setCpf(cpfValue)
  setStep(5)
}
```

- [ ] **Step 3: Add Step 4 — Pagamento**

Replace the step 4 block with this new structure. Add between Step 3 and the old Step 4:

```typescript
{/* Step 4 — Pagamento */}
{step === 4 && (
  <div>
    <h2 className="font-display italic text-2xl text-ink-800 mb-6">Pagamento</h2>
    <CreditCardForm
      onTokenCreated={handleTokenCreated}
      isLoading={submitting}
    />
    <Button variant="outline" className="w-full rounded-pill mt-4" onClick={() => setStep(3)}>
      Voltar
    </Button>
  </div>
)}
```

- [ ] **Step 4: Update old Step 4 to Step 5**

Rename the existing confirmation step section to handle `step === 5` and add product images. Update the handleFinalize to include card token:

```typescript
const handleFinalize = async () => {
  setSubmitting(true)
  try {
    const order = await orderService.create({
      items: items.map(i => ({ productId: i.productId, variantId: i.variantId, qty: i.qty, price: i.price })),
      neighborhoodId: selectedNeighborhood!.id,
      deliveryMethod: 'motoboy',
      deliveryMessage: message || undefined,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      cardToken,
      paymentMethodId,
      installments: 1,
      cpf
    })
    clearCart()
    navigate(`/pedido/${order.id}`)
  } catch {
    alert('Erro ao criar pedido. Tente novamente.')
  } finally {
    setSubmitting(false)
  }
}
```

- [ ] **Step 5: Update Confirmação section to include product images**

Update the section header and add product image grid before the summary:

```typescript
{/* Step 5 — Confirmacao */}
{step === 5 && (
  <div>
    <h2 className="font-display italic text-2xl text-ink-800 mb-6">Confirmar pedido</h2>
    
    {/* Product Images Grid */}
    <div className="grid grid-cols-3 gap-3 mb-6">
      {items.map(item => {
        const images = item.productImages ? JSON.parse(item.productImages) : []
        const mainImage = images[0] || null
        return (
          <div key={`${item.productId}-${item.variantId}`} className="rounded-lg overflow-hidden bg-ink-50 aspect-square">
            {mainImage ? (
              <img
                src={mainImage}
                alt={item.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-300">
                Sem imagem
              </div>
            )}
          </div>
        )
      })}
    </div>

    {/* Rest of confirmation summary */}
    <div className="bg-white border border-ink-200 rounded-lg divide-y divide-ink-100 mb-6">
      {/* ... existing summary code ... */}
    </div>
    
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1 rounded-pill" onClick={() => setStep(4)}>Voltar</Button>
      <Button className="flex-1 bg-ink-800 hover:bg-lilac-500 text-white rounded-pill" disabled={submitting} onClick={handleFinalize}>
        {submitting ? 'Finalizando...' : 'Finalizar pedido'}
      </Button>
    </div>
  </div>
)}
```

- [ ] **Step 6: Update "Continuar" button for Step 3 to go to Step 4**

Change the onClick from `setStep(4)` to `setStep(4)` (already correct, just ensure it's there)

- [ ] **Step 7: Import CreditCardForm at the top**

Add import:

```typescript
import { CreditCardForm } from '@/components/features/CreditCardForm'
```

---

## Task 8: Update Frontend Order Service + Confirmation Page

**Files:**
- Modify: `frontend/src/services/orderService.ts`
- Modify: `frontend/src/pages/checkout/OrderConfirmationPage.tsx`

- [ ] **Step 1: Update orderService to accept payment fields**

```typescript
import { api } from '@/lib/axios'

export interface CreateOrderPayload {
  items: { productId: number; variantId: number | null; qty: number; price: number }[]
  neighborhoodId: number
  deliveryMethod: string
  deliveryMessage?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  cardToken?: string
  paymentMethodId?: string
  installments?: number
  cpf?: string
}

export interface OrderResult {
  id: number
  status: string
  paymentStatus: string
  total: number
}

export const orderService = {
  async create(payload: CreateOrderPayload): Promise<OrderResult> {
    const { data } = await api.post<OrderResult>('/orders', payload)
    return data
  },
}
```

- [ ] **Step 2: Update OrderConfirmationPage to show payment status**

```typescript
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  
  useEffect(() => {
    // Optional: fetch order details to show payment status
  }, [id])

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'leaf-500'
    if (status === 'pending') return 'petal-400'
    return 'ink-400'
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-7 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-leaf-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-leaf-500 text-3xl">✓</span>
        </div>
        <h1 className="font-display italic text-3xl text-ink-800 mb-2">
          Pedido #{id} confirmado!
        </h1>
        <p className="text-ink-500 text-sm mb-8">
          Em breve entraremos em contato para confirmar a entrega.
        </p>
        <a
          href="/loja"
          className="inline-block bg-ink-800 hover:bg-lilac-500 text-white text-sm font-medium px-6 py-3 rounded-pill transition-colors"
        >
          Continuar comprando
        </a>
      </div>
    </Layout>
  )
}
```

---

## Verification Checklist

- [ ] Schema migration runs without errors
- [ ] Backend starts without errors (`npm run dev`)
- [ ] Frontend installs dependencies without errors (`npm install`)
- [ ] MP SDK script loads (check browser console for MercadoPago object)
- [ ] Checkout flow: complete steps 1-4, see card animation
- [ ] Step 5: product images display, all order data visible
- [ ] Click "Finalizar": card tokenizes, order created, redirect to /pedido/:id
- [ ] Order record in database has `paymentStatus = 'approved'` (or 'pending'/'rejected')
- [ ] Inspect network tab: POST /orders contains `cardToken`, `paymentMethodId`, `cpf`
