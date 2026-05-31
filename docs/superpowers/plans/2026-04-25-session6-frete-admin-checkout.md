# Sessão 6 — Frete (Admin Config) + Checkout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema completo de entrega: schema City+Neighborhood, seed com Nova Friburgo/109 bairros, admin CRUD de fretes, e checkout 4 steps com ViaCEP + criação de pedido.

**Architecture:** Backend adiciona City e Neighborhood (com cityId+isActive), adminMiddleware para rotas protegidas. Checkout frontend chama ViaCEP direto, verifica city match via `/api/v1/cities`, exibe bairros, e cria Order via POST autenticado. Admin usa AdminLayout com sidebar ink-800 e CRUD via Dialog shadcn.

**Tech Stack:** Prisma migrations, Express 5, React 18, React Hook Form, Zod, shadcn (Dialog, Select, Table), ViaCEP (público, sem chave).

---

## Mapa de Arquivos

**Backend:**
| Ação | Arquivo |
|------|---------|
| Modificar | `backend/prisma/schema.prisma` |
| Modificar | `backend/prisma/seed.ts` |
| Criar | `backend/src/middlewares/adminMiddleware.ts` |
| Criar | `backend/src/services/cityService.ts` |
| Criar | `backend/src/services/neighborhoodService.ts` |
| Criar | `backend/src/services/orderService.ts` |
| Criar | `backend/src/controllers/cityController.ts` |
| Criar | `backend/src/controllers/neighborhoodController.ts` |
| Criar | `backend/src/controllers/orderController.ts` |
| Criar | `backend/src/routes/cities.ts` |
| Criar | `backend/src/routes/neighborhoods.ts` |
| Criar | `backend/src/routes/orders.ts` |
| Criar | `backend/src/routes/admin/cities.ts` |
| Criar | `backend/src/routes/admin/neighborhoods.ts` |
| Modificar | `backend/src/server.ts` |

**Frontend:**
| Ação | Arquivo |
|------|---------|
| Instalar | shadcn Select + Table |
| Criar | `frontend/src/components/features/AdminRoute.tsx` |
| Criar | `frontend/src/components/layout/AdminLayout.tsx` |
| Criar | `frontend/src/pages/admin/AdminDashboard.tsx` |
| Criar | `frontend/src/pages/admin/AdminFretesPage.tsx` |
| Criar | `frontend/src/services/neighborhoodService.ts` |
| Criar | `frontend/src/services/orderService.ts` |
| Modificar | `frontend/src/pages/checkout/CheckoutPage.tsx` |
| Criar | `frontend/src/pages/checkout/OrderConfirmationPage.tsx` |
| Modificar | `frontend/src/App.tsx` |

---

## Task 1: Backend — Schema Migration

**Files:**
- Modify: `fresia-claude-setup/fresia/backend/prisma/schema.prisma`

- [ ] **Step 1: Substituir `backend/prisma/schema.prisma` na íntegra**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int       @id @default(autoincrement())
  name         String
  email        String    @unique
  passwordHash String
  phone        String?
  isAdmin      Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  addresses    Address[]
  orders       Order[]
}

model Address {
  id           Int     @id @default(autoincrement())
  userId       Int
  street       String
  number       String
  complement   String?
  neighborhood String
  city         String
  state        String
  zipCode      String
  isDefault    Boolean @default(false)
  user         User    @relation(fields: [userId], references: [id])
}

model City {
  id            Int            @id @default(autoincrement())
  name          String
  state         String
  ibgeCode      String?
  neighborhoods Neighborhood[]
}

model Neighborhood {
  id          Int     @id @default(autoincrement())
  cityId      Int
  name        String
  deliveryFee Decimal @db.Decimal(10, 2)
  isActive    Boolean @default(true)
  city        City    @relation(fields: [cityId], references: [id])
  orders      Order[]
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String
  slug     String    @unique
  products Product[]
}

model Product {
  id          Int              @id @default(autoincrement())
  name        String
  slug        String           @unique
  description String?          @db.Text
  price       Decimal          @db.Decimal(10, 2)
  stock       Int              @default(0)
  images      String?          @db.Text
  isActive    Boolean          @default(true)
  categoryId  Int
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  category    Category         @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]
  orderItems  OrderItem[]
}

model ProductVariant {
  id         Int         @id @default(autoincrement())
  productId  Int
  name       String
  price      Decimal     @db.Decimal(10, 2)
  stock      Int         @default(0)
  product    Product     @relation(fields: [productId], references: [id])
  orderItems OrderItem[]
}

model Order {
  id              Int           @id @default(autoincrement())
  userId          Int
  status          String        @default("pending")
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

model OrderItem {
  id        Int             @id @default(autoincrement())
  orderId   Int
  productId Int
  variantId Int?
  qty       Int
  price     Decimal         @db.Decimal(10, 2)
  order     Order           @relation(fields: [orderId], references: [id])
  product   Product         @relation(fields: [productId], references: [id])
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
}

model Setting {
  key   String @id
  value String @db.Text
}
```

- [ ] **Step 2: Rodar migration**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx prisma migrate dev --name add-city-neighborhood-order-update
```

Esperado: `Your database is now in sync with your schema.`

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/prisma/
git commit -m "feat(backend): schema City, Neighborhood com cityId, Order com deliveryMethod e customer"
```

---

## Task 2: Backend — Seed Atualizado

**Files:**
- Modify: `fresia-claude-setup/fresia/backend/prisma/seed.ts`

- [ ] **Step 1: Substituir `backend/prisma/seed.ts` na íntegra**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const NEIGHBORHOODS: { name: string; fee: number }[] = [
  { name: 'ALTO DAS BRAUNES', fee: 13 },
  { name: 'ALTO DE OLARIA', fee: 13 },
  { name: 'ALTO DO CALEDÔNIA', fee: 31 },
  { name: 'ALTO DO CASCATINHA (CANTÃO SUIÇO)', fee: 21 },
  { name: 'ALTO DO FLORESTA', fee: 21 },
  { name: 'ALTO DO MOZER', fee: 21 },
  { name: 'ALTO DO SCHUENCK', fee: 51 },
  { name: 'ALTO DOS 50', fee: 51 },
  { name: 'AMPARO', fee: 33 },
  { name: 'BOA ESPERANÇA', fee: 81 },
  { name: 'BOM JARDIM', fee: 51 },
  { name: 'BOM JESUS 1 E 2', fee: 15 },
  { name: 'BRAUNES', fee: 12 },
  { name: 'CALEDÔNIA (ATÉ CALEDONIA INN)', fee: 26 },
  { name: 'CAMPO DO COELHO', fee: 36 },
  { name: 'CANTO DO RIACHO', fee: 23 },
  { name: 'CARDINOT', fee: 34 },
  { name: 'CASCATINHA', fee: 16 },
  { name: 'CATARCIONE', fee: 13 },
  { name: 'CENTRO', fee: 11 },
  { name: 'CHÁCARA ATÉ UNIMED', fee: 14 },
  { name: 'CHÁCARA DEPOIS UNIMED', fee: 17 },
  { name: 'CÔNEGO (ATÉ IGREJA ADVENTISTA)', fee: 13 },
  { name: 'COND. STUKY', fee: 27 },
  { name: 'CONDOMÍNIO REMANSO PERISSÊ', fee: 14 },
  { name: 'CONQUISTA', fee: 46 },
  { name: 'CONSELHEIRO PAULINO', fee: 16 },
  { name: 'CORDOEIRA', fee: 12 },
  { name: 'CÓRREGO DANTAS (ATÉ EBMA)', fee: 17 },
  { name: 'CÓRREGO DANTAS (DEPOIS EBMA)', fee: 23 },
  { name: 'DEBOSSAN', fee: 29 },
  { name: 'DUAS PEDRAS', fee: 13 },
  { name: 'FAZENDA BELA VISTA', fee: 20 },
  { name: 'FAZENDA DA LAJE (ATÉ CEMITÉRIO)', fee: 23 },
  { name: 'FAZENDA DA LAJE (APÓS CEMITÉRIO)', fee: 29 },
  { name: 'FLORESTA', fee: 19 },
  { name: 'FURNAS', fee: 28 },
  { name: 'GALDINÓPOLIS', fee: 81 },
  { name: 'GENERAL OSÓRIO', fee: 11 },
  { name: 'GIRASSOL', fee: 17 },
  { name: 'GRANJA DO CÉU', fee: 16 },
  { name: 'GRANJA MIMOSA', fee: 16 },
  { name: 'GRANJA SPINELLI', fee: 19 },
  { name: 'HORTO DO VINO', fee: 18 },
  { name: 'HOSPITAL RAUL SERTÃ', fee: 13 },
  { name: 'HOSPITAL SÃO LUCAS', fee: 14 },
  { name: 'HOSPITAL UNIMED', fee: 16 },
  { name: 'JARDILÂNDIA', fee: 15 },
  { name: 'JARDIM CALIFÓRNIA', fee: 18 },
  { name: 'JARDIM MARAJOÍ', fee: 17 },
  { name: 'JARDIM OURO PRETO', fee: 14 },
  { name: 'LAGOINHA', fee: 13 },
  { name: 'LAZARETO', fee: 15 },
  { name: 'LUMIAR', fee: 71 },
  { name: 'MACAÉ DE CIMA', fee: 91 },
  { name: 'MARIA TEREZA', fee: 21 },
  { name: 'MARINGÁ', fee: 31 },
  { name: 'MARECHAL RONDON', fee: 15 },
  { name: 'MORRO DOS MAIAS / BELMONT', fee: 21 },
  { name: 'MURY ATÉ PATRULHA', fee: 18 },
  { name: 'MURY DEPOIS PATRULHA', fee: 21 },
  { name: 'NOVA SUÍÇA', fee: 19 },
  { name: 'OLARIA', fee: 12 },
  { name: 'P. SAUDADE ATÉ BUSCKY', fee: 13 },
  { name: 'P. SAUDADE APÓS BUSCKY', fee: 17 },
  { name: 'PARADA FOLLY', fee: 26 },
  { name: 'PARQUE DAS FLORES', fee: 23 },
  { name: 'PARQUE IMPERIAL', fee: 18 },
  { name: 'PARQUE SÃO CLEMENTE', fee: 12 },
  { name: 'PERISSÊ', fee: 12 },
  { name: 'PRAÇA DA FURANFA', fee: 17 },
  { name: 'PRADO', fee: 15 },
  { name: 'RIO BONITO', fee: 91 },
  { name: 'RIO GRANDE DE CIMA', fee: 71 },
  { name: 'RIOGRANDINA', fee: 33 },
  { name: 'RUA EUTERPE FRIBURGUENSE', fee: 11 },
  { name: 'RUI SANGLARD', fee: 15 },
  { name: 'SALINAS', fee: 91 },
  { name: 'SANATÓRIO NAVAL', fee: 13 },
  { name: 'SANTA BERNADETE', fee: 17 },
  { name: 'SANTA ELIZA', fee: 13 },
  { name: 'SANTA TEREZINHA (SÃO JORGE)', fee: 18 },
  { name: 'SÃO CRISTÓVÃO', fee: 15 },
  { name: 'SÃO GERALDO ATÉ SERRA AZUL', fee: 16 },
  { name: 'SÃO GERALDO APÓS SERRA AZUL', fee: 20 },
  { name: 'SÃO GERALDO VALE DA MONTANHA', fee: 21 },
  { name: 'SÃO JORGE', fee: 18 },
  { name: 'SÃO LOURENÇO', fee: 91 },
  { name: 'SÃO PEDRO', fee: 81 },
  { name: 'SANTO ANDRÉ', fee: 16 },
  { name: 'SERRA NEVADA', fee: 31 },
  { name: 'SERRAVILLE', fee: 12 },
  { name: 'SÍTIO SÃO LUIZ', fee: 16 },
  { name: 'SOLARES', fee: 16 },
  { name: 'STUCKY', fee: 46 },
  { name: 'TERRA NOVA', fee: 21 },
  { name: 'THEODORO', fee: 31 },
  { name: 'TINGUILY', fee: 13 },
  { name: 'TOLEDO', fee: 45 },
  { name: 'TRÊS IRMÃOS', fee: 18 },
  { name: 'VALE DOS PINHEIROS', fee: 13 },
  { name: 'VARGEM ALTA (ATÉ HORTO HERCKET)', fee: 66 },
  { name: 'VARGEM GRANDE CÔNEGO', fee: 16 },
  { name: 'VARGINHA', fee: 16 },
  { name: 'VILA AMÉLIA', fee: 12 },
  { name: 'VILA NOVA', fee: 13 },
  { name: 'VILAGE', fee: 13 },
  { name: 'YPU', fee: 12 },
]

async function main() {
  // Limpar dados existentes
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.neighborhood.deleteMany()
  await prisma.city.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()

  // Admin user
  const adminHash = await bcrypt.hash('Lets291224#', 12)
  await prisma.user.create({
    data: {
      name: 'Constantino',
      email: 'constantino.dev.br@gmail.com',
      passwordHash: adminHash,
      isAdmin: true,
    },
  })

  // Cidade Nova Friburgo
  const novaFriburgo = await prisma.city.create({
    data: { name: 'Nova Friburgo', state: 'RJ', ibgeCode: '3303401' },
  })

  // Bairros
  await prisma.neighborhood.createMany({
    data: NEIGHBORHOODS.map(n => ({
      cityId: novaFriburgo.id,
      name: n.name,
      deliveryFee: n.fee,
      isActive: true,
    })),
  })

  // Categorias
  const buques    = await prisma.category.create({ data: { name: 'Buquês',    slug: 'buques'    } })
  const arranjos  = await prisma.category.create({ data: { name: 'Arranjos',  slug: 'arranjos'  } })
  const plantas   = await prisma.category.create({ data: { name: 'Plantas',   slug: 'plantas'   } })
  const presentes = await prisma.category.create({ data: { name: 'Presentes', slug: 'presentes' } })

  const products = [
    { name: 'Buquê Primavera Rosa', slug: 'buque-primavera-rosa', categoryId: buques.id, description: 'Um buquê fresco e delicado, perfeito para presentear em qualquer ocasião especial.', price: 89, stock: 23, variants: [{ name: 'Pequeno', price: 89, stock: 10 }, { name: 'Médio', price: 119, stock: 8 }, { name: 'Grande', price: 159, stock: 5 }] },
    { name: 'Buquê Amor Eterno', slug: 'buque-amor-eterno', categoryId: buques.id, description: 'Rosas vermelhas selecionadas, símbolo do amor verdadeiro e eterno.', price: 129, stock: 13, variants: [{ name: '12 Rosas', price: 129, stock: 8 }, { name: '24 Rosas', price: 219, stock: 5 }] },
    { name: 'Buquê Silvestre', slug: 'buque-silvestre', categoryId: buques.id, description: 'Flores silvestres coloridas para um toque natural e espontâneo.', price: 75, stock: 18, variants: [{ name: 'Pequeno', price: 75, stock: 12 }, { name: 'Grande', price: 115, stock: 6 }] },
    { name: 'Arranjo Tropical', slug: 'arranjo-tropical', categoryId: arranjos.id, description: 'Flores exóticas e tropicais que trazem alegria e cor a qualquer ambiente.', price: 120, stock: 11, variants: [{ name: 'Mesa', price: 120, stock: 7 }, { name: 'Grande', price: 185, stock: 4 }] },
    { name: 'Arranjo Mesa Elegante', slug: 'arranjo-mesa-elegante', categoryId: arranjos.id, description: 'Arranjo sofisticado para decorar mesas de jantar e eventos especiais.', price: 145, stock: 12, variants: [{ name: 'Compacto', price: 145, stock: 6 }, { name: 'Padrão', price: 195, stock: 4 }, { name: 'Premium', price: 265, stock: 2 }] },
    { name: 'Arranjo Campestre', slug: 'arranjo-campestre', categoryId: arranjos.id, description: 'Charme e simplicidade do campo reunidos em um arranjo encantador.', price: 95, stock: 9, variants: [{ name: 'Único', price: 95, stock: 9 }] },
    { name: 'Suculenta Trio', slug: 'suculenta-trio', categoryId: plantas.id, description: 'Conjunto de três suculentas cuidadosamente selecionadas, baixa manutenção.', price: 55, stock: 25, variants: [{ name: 'Pequeno', price: 55, stock: 15 }, { name: 'Médio', price: 85, stock: 10 }] },
    { name: 'Orquídea Branca', slug: 'orquidea-branca', categoryId: plantas.id, description: 'Orquídea Phalaenopsis branca, elegante e duradoura, ideal para presentear.', price: 89, stock: 13, variants: [{ name: '1 Haste', price: 89, stock: 8 }, { name: '2 Hastes', price: 149, stock: 5 }] },
    { name: 'Ficus Lyrata', slug: 'ficus-lyrata', categoryId: plantas.id, description: 'A planta queridinha da decoração, com folhas grandes e marcantes.', price: 120, stock: 12, variants: [{ name: 'P (30cm)', price: 120, stock: 6 }, { name: 'M (60cm)', price: 185, stock: 4 }, { name: 'G (90cm)', price: 265, stock: 2 }] },
    { name: 'Kit Romântico', slug: 'kit-romantico', categoryId: presentes.id, description: 'Buquê de rosas, chocolates finos e cartão personalizado para surpreender.', price: 185, stock: 12, variants: [{ name: 'Padrão', price: 185, stock: 8 }, { name: 'Premium', price: 265, stock: 4 }] },
    { name: 'Cesta Floral', slug: 'cesta-floral', categoryId: presentes.id, description: 'Cesta artesanal com flores frescas, ideal para comemorações especiais.', price: 145, stock: 9, variants: [{ name: 'Pequena', price: 145, stock: 6 }, { name: 'Grande', price: 215, stock: 3 }] },
    { name: 'Box Especial', slug: 'box-especial', categoryId: presentes.id, description: 'Box exclusiva com flores, vela aromática e mensagem personalizada.', price: 225, stock: 5, variants: [{ name: 'Único', price: 225, stock: 5 }] },
  ]

  for (const { variants, ...product } of products) {
    const created = await prisma.product.create({ data: { ...product, images: JSON.stringify([]) } })
    await prisma.productVariant.createMany({ data: variants.map(v => ({ ...v, productId: created.id })) })
  }

  console.log(`Seed concluido: 1 admin, 1 cidade, ${NEIGHBORHOODS.length} bairros, 4 categorias, 12 produtos.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Rodar seed**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npm run seed
```

Esperado: `Seed concluido: 1 admin, 1 cidade, 109 bairros, 4 categorias, 12 produtos.`

- [ ] **Step 3: Verificar admin no banco**

```bash
"C:/xampp/mysql/bin/mysql.exe" -u root fresia -e "SELECT id, name, email, isAdmin FROM User;"
```

Esperado: linha com `constantino.dev.br@gmail.com` e `isAdmin=1`.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/prisma/seed.ts
git commit -m "feat(backend): seed com admin, Nova Friburgo e 109 bairros"
```

---

## Task 3: Backend — adminMiddleware + Services

**Files:**
- Create: `backend/src/middlewares/adminMiddleware.ts`
- Create: `backend/src/services/cityService.ts`
- Create: `backend/src/services/neighborhoodService.ts`
- Create: `backend/src/services/orderService.ts`

- [ ] **Step 1: Criar `backend/src/middlewares/adminMiddleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user?.isAdmin) return res.status(403).json({ error: 'Acesso negado' })
  next()
}
```

- [ ] **Step 2: Criar `backend/src/services/cityService.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const cityService = {
  async findAll() {
    return prisma.city.findMany({
      include: { _count: { select: { neighborhoods: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' },
    })
  },

  async create(name: string, state: string, ibgeCode?: string) {
    return prisma.city.create({ data: { name, state, ibgeCode } })
  },

  async update(id: number, data: Partial<{ name: string; state: string; ibgeCode: string }>) {
    return prisma.city.update({ where: { id }, data })
  },

  async delete(id: number) {
    return prisma.city.delete({ where: { id } })
  },
}
```

- [ ] **Step 3: Criar `backend/src/services/neighborhoodService.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const neighborhoodService = {
  async findByCityId(cityId: number) {
    return prisma.neighborhood.findMany({
      where: { cityId, isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  async findAllAdmin(cityId?: number) {
    return prisma.neighborhood.findMany({
      where: cityId ? { cityId } : undefined,
      include: { city: { select: { id: true, name: true, state: true } } },
      orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
    })
  },

  async create(cityId: number, name: string, deliveryFee: number) {
    return prisma.neighborhood.create({ data: { cityId, name, deliveryFee, isActive: true } })
  },

  async update(id: number, data: Partial<{ name: string; deliveryFee: number; isActive: boolean }>) {
    return prisma.neighborhood.update({ where: { id }, data })
  },

  async delete(id: number) {
    return prisma.neighborhood.delete({ where: { id } })
  },
}
```

- [ ] **Step 4: Criar `backend/src/services/orderService.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

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
}

export const orderService = {
  async create(input: CreateOrderInput) {
    const neighborhood = await prisma.neighborhood.findUnique({ where: { id: input.neighborhoodId } })
    if (!neighborhood) throw Object.assign(new Error('Bairro não encontrado'), { statusCode: 404 })

    const deliveryFee = Number(neighborhood.deliveryFee)
    const itemsTotal = input.items.reduce((acc, i) => acc + i.price * i.qty, 0)
    const total = itemsTotal + deliveryFee

    return prisma.order.create({
      data: {
        userId: input.userId,
        status: 'pending',
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
      select: { id: true, status: true, total: true },
    })
  },
}
```

- [ ] **Step 5: Verificar tipagem backend**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/src/
git commit -m "feat(backend): adminMiddleware e services city/neighborhood/order"
```

---

## Task 4: Backend — Controllers + Routes + Server

**Files:**
- Create: `backend/src/controllers/cityController.ts`
- Create: `backend/src/controllers/neighborhoodController.ts`
- Create: `backend/src/controllers/orderController.ts`
- Create: `backend/src/routes/cities.ts`
- Create: `backend/src/routes/neighborhoods.ts`
- Create: `backend/src/routes/orders.ts`
- Create: `backend/src/routes/admin/cities.ts`
- Create: `backend/src/routes/admin/neighborhoods.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Criar `backend/src/controllers/cityController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { cityService } from '../services/cityService'

export const cityController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await cityService.findAll()) } catch (err) { next(err) }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, state, ibgeCode } = req.body
      res.status(201).json(await cityService.create(name, state, ibgeCode))
    } catch (err) { next(err) }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await cityService.update(Number(req.params.id), req.body))
    } catch (err) { next(err) }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await cityService.delete(Number(req.params.id))
      res.json({ message: 'ok' })
    } catch (err) { next(err) }
  },
}
```

- [ ] **Step 2: Criar `backend/src/controllers/neighborhoodController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { neighborhoodService } from '../services/neighborhoodService'

export const neighborhoodController = {
  async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query.cityId ? Number(req.query.cityId) : undefined
      if (!cityId) return res.status(400).json({ error: 'cityId obrigatório' })
      res.json(await neighborhoodService.findByCityId(cityId))
    } catch (err) { next(err) }
  },
  async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query.cityId ? Number(req.query.cityId) : undefined
      res.json(await neighborhoodService.findAllAdmin(cityId))
    } catch (err) { next(err) }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId, name, deliveryFee } = req.body
      res.status(201).json(await neighborhoodService.create(Number(cityId), name, Number(deliveryFee)))
    } catch (err) { next(err) }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await neighborhoodService.update(Number(req.params.id), req.body))
    } catch (err) { next(err) }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await neighborhoodService.delete(Number(req.params.id))
      res.json({ message: 'ok' })
    } catch (err) { next(err) }
  },
}
```

- [ ] **Step 3: Criar `backend/src/controllers/orderController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { orderService } from '../services/orderService'

export const orderController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id
      const { items, neighborhoodId, deliveryMethod, deliveryMessage, customerName, customerEmail, customerPhone } = req.body
      const order = await orderService.create({ userId, items, neighborhoodId: Number(neighborhoodId), deliveryMethod, deliveryMessage, customerName, customerEmail, customerPhone })
      res.status(201).json(order)
    } catch (err) { next(err) }
  },
}
```

- [ ] **Step 4: Criar rotas públicas**

`backend/src/routes/cities.ts`:
```typescript
import { Router } from 'express'
import { cityController } from '../controllers/cityController'
const router = Router()
router.get('/', cityController.list)
export default router
```

`backend/src/routes/neighborhoods.ts`:
```typescript
import { Router } from 'express'
import { neighborhoodController } from '../controllers/neighborhoodController'
const router = Router()
router.get('/', neighborhoodController.listPublic)
export default router
```

`backend/src/routes/orders.ts`:
```typescript
import { Router } from 'express'
import { orderController } from '../controllers/orderController'
import { authMiddleware } from '../middlewares/authMiddleware'
const router = Router()
router.post('/', authMiddleware, orderController.create)
export default router
```

- [ ] **Step 5: Criar rotas admin**

Criar pasta `backend/src/routes/admin/` e os arquivos:

`backend/src/routes/admin/cities.ts`:
```typescript
import { Router } from 'express'
import { cityController } from '../../controllers/cityController'
const router = Router()
router.get('/', cityController.list)
router.post('/', cityController.create)
router.patch('/:id', cityController.update)
router.delete('/:id', cityController.remove)
export default router
```

`backend/src/routes/admin/neighborhoods.ts`:
```typescript
import { Router } from 'express'
import { neighborhoodController } from '../../controllers/neighborhoodController'
const router = Router()
router.get('/', neighborhoodController.listAdmin)
router.post('/', neighborhoodController.create)
router.patch('/:id', neighborhoodController.update)
router.delete('/:id', neighborhoodController.remove)
export default router
```

- [ ] **Step 6: Atualizar `backend/src/server.ts`**

```typescript
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

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))

app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/cities', citiesRouter)
app.use('/api/v1/neighborhoods', neighborhoodsRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/admin/cities', authMiddleware, adminMiddleware, adminCitiesRouter)
app.use('/api/v1/admin/neighborhoods', authMiddleware, adminMiddleware, adminNeighborhoodsRouter)

app.use(errorHandler)

app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`))
```

- [ ] **Step 7: Verificar tipagem e testar**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/backend"
npx tsc --noEmit
```

Reiniciar backend e testar:
```bash
curl -s http://localhost:3001/api/v1/cities
```
Esperado: `[{"id":1,"name":"Nova Friburgo","state":"RJ","ibgeCode":"3303401","_count":{"neighborhoods":109}}]`

```bash
curl -s "http://localhost:3001/api/v1/neighborhoods?cityId=1" | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} bairros')"
```
Esperado: `109 bairros`

- [ ] **Step 8: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add backend/src/
git commit -m "feat(backend): controllers, routes e server com cities/neighborhoods/orders/admin"
```

---

## Task 5: Frontend — Instalar deps + AdminRoute + AdminLayout + AdminDashboard

**Files:**
- Install: shadcn Select + Table
- Create: `frontend/src/components/features/AdminRoute.tsx`
- Create: `frontend/src/components/layout/AdminLayout.tsx`
- Create: `frontend/src/pages/admin/AdminDashboard.tsx`

- [ ] **Step 1: Instalar shadcn Select e Table**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx shadcn@latest add select table --yes
```

Esperado: `select.tsx` e `table.tsx` criados em `src/components/ui/`.

- [ ] **Step 2: Criar `frontend/src/components/features/AdminRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lilac-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 3: Criar `frontend/src/components/layout/AdminLayout.tsx`**

```tsx
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/fretes', label: 'Cidades e Fretes' },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, setUser } = useAuthStore()

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <div className="flex h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className="w-60 bg-ink-800 flex flex-col">
        <div className="px-6 py-5 border-b border-ink-700">
          <a href="/" className="font-display italic text-2xl text-lilac-500">
            Frésia
          </a>
          <p className="text-[10px] text-ink-500 mt-0.5">Painel Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-ink-700">
          <p className="text-xs text-ink-400 mb-2 truncate">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-ink-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Criar `frontend/src/pages/admin/AdminDashboard.tsx`**

```tsx
import { AdminLayout } from '@/components/layout/AdminLayout'

export function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="font-display italic text-3xl text-ink-800 mb-2">Dashboard</h1>
        <p className="text-ink-500 text-sm">Estatísticas em breve.</p>
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 5: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/features/AdminRoute.tsx frontend/src/components/layout/AdminLayout.tsx frontend/src/pages/admin/AdminDashboard.tsx frontend/src/components/ui/select.tsx frontend/src/components/ui/table.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): AdminRoute, AdminLayout, AdminDashboard e shadcn select/table"
```

---

## Task 6: Frontend — AdminFretesPage (CRUD cidades e bairros)

**Files:**
- Create: `frontend/src/services/neighborhoodService.ts`
- Create: `frontend/src/pages/admin/AdminFretesPage.tsx`

- [ ] **Step 1: Criar `frontend/src/services/neighborhoodService.ts`**

```typescript
import { api } from '@/lib/axios'

export interface City {
  id: number
  name: string
  state: string
  ibgeCode: string | null
  _count: { neighborhoods: number }
}

export interface Neighborhood {
  id: number
  cityId: number
  name: string
  deliveryFee: number
  isActive: boolean
}

export const neighborhoodService = {
  async getCities(): Promise<City[]> {
    const { data } = await api.get<City[]>('/cities')
    return data
  },

  async getNeighborhoods(cityId: number): Promise<Neighborhood[]> {
    const { data } = await api.get<Neighborhood[]>('/neighborhoods', { params: { cityId } })
    return data
  },

  async getAdminNeighborhoods(cityId?: number): Promise<Neighborhood[]> {
    const { data } = await api.get<Neighborhood[]>('/admin/neighborhoods', {
      params: cityId ? { cityId } : undefined,
    })
    return data
  },

  async createCity(name: string, state: string): Promise<City> {
    const { data } = await api.post<City>('/admin/cities', { name, state })
    return data
  },

  async updateCity(id: number, data: Partial<{ name: string; state: string }>): Promise<City> {
    const { data: city } = await api.patch<City>(`/admin/cities/${id}`, data)
    return city
  },

  async deleteCity(id: number): Promise<void> {
    await api.delete(`/admin/cities/${id}`)
  },

  async createNeighborhood(cityId: number, name: string, deliveryFee: number): Promise<Neighborhood> {
    const { data } = await api.post<Neighborhood>('/admin/neighborhoods', { cityId, name, deliveryFee })
    return data
  },

  async updateNeighborhood(id: number, data: Partial<{ name: string; deliveryFee: number; isActive: boolean }>): Promise<Neighborhood> {
    const { data: n } = await api.patch<Neighborhood>(`/admin/neighborhoods/${id}`, data)
    return n
  },

  async deleteNeighborhood(id: number): Promise<void> {
    await api.delete(`/admin/neighborhoods/${id}`)
  },
}
```

- [ ] **Step 2: Criar `frontend/src/pages/admin/AdminFretesPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { neighborhoodService, type City, type Neighborhood } from '@/services/neighborhoodService'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export function AdminFretesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Record<number, Neighborhood[]>>({})
  const [expandedCity, setExpandedCity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [cityDialog, setCityDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; city?: City }>({ open: false, mode: 'create' })
  const [neighborDialog, setNeighborDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; cityId?: number; neighbor?: Neighborhood }>({ open: false, mode: 'create' })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'city' | 'neighborhood'; id: number; name: string } | null>(null)

  // Form states
  const [cityForm, setCityForm] = useState({ name: '', state: '' })
  const [neighborForm, setNeighborForm] = useState({ name: '', deliveryFee: '', isActive: true })

  useEffect(() => {
    neighborhoodService.getCities().then(data => { setCities(data); setLoading(false) })
  }, [])

  const loadNeighborhoods = async (cityId: number) => {
    if (neighborhoods[cityId]) return
    const data = await neighborhoodService.getAdminNeighborhoods(cityId)
    setNeighborhoods(prev => ({ ...prev, [cityId]: data }))
  }

  const toggleCity = (cityId: number) => {
    if (expandedCity === cityId) {
      setExpandedCity(null)
    } else {
      setExpandedCity(cityId)
      loadNeighborhoods(cityId)
    }
  }

  const handleSaveCity = async () => {
    if (cityDialog.mode === 'create') {
      const city = await neighborhoodService.createCity(cityForm.name, cityForm.state)
      setCities(prev => [...prev, city])
    } else if (cityDialog.city) {
      const updated = await neighborhoodService.updateCity(cityDialog.city.id, cityForm)
      setCities(prev => prev.map(c => c.id === cityDialog.city!.id ? { ...c, ...updated } : c))
    }
    setCityDialog({ open: false, mode: 'create' })
  }

  const handleSaveNeighbor = async () => {
    const fee = parseFloat(neighborForm.deliveryFee)
    if (neighborDialog.mode === 'create' && neighborDialog.cityId) {
      const n = await neighborhoodService.createNeighborhood(neighborDialog.cityId, neighborForm.name, fee)
      setNeighborhoods(prev => ({
        ...prev,
        [neighborDialog.cityId!]: [...(prev[neighborDialog.cityId!] ?? []), n],
      }))
      setCities(prev => prev.map(c => c.id === neighborDialog.cityId ? { ...c, _count: { neighborhoods: c._count.neighborhoods + 1 } } : c))
    } else if (neighborDialog.neighbor) {
      const updated = await neighborhoodService.updateNeighborhood(neighborDialog.neighbor.id, {
        name: neighborForm.name,
        deliveryFee: fee,
        isActive: neighborForm.isActive,
      })
      const cid = neighborDialog.neighbor.cityId
      setNeighborhoods(prev => ({
        ...prev,
        [cid]: (prev[cid] ?? []).map(n => n.id === neighborDialog.neighbor!.id ? { ...n, ...updated } : n),
      }))
    }
    setNeighborDialog({ open: false, mode: 'create' })
  }

  const handleDelete = async () => {
    if (!deleteDialog) return
    if (deleteDialog.type === 'city') {
      await neighborhoodService.deleteCity(deleteDialog.id)
      setCities(prev => prev.filter(c => c.id !== deleteDialog.id))
    } else {
      const neighbor = Object.values(neighborhoods).flat().find(n => n.id === deleteDialog.id)
      await neighborhoodService.deleteNeighborhood(deleteDialog.id)
      if (neighbor) {
        setNeighborhoods(prev => ({
          ...prev,
          [neighbor.cityId]: (prev[neighbor.cityId] ?? []).filter(n => n.id !== deleteDialog.id),
        }))
      }
    }
    setDeleteDialog(null)
  }

  if (loading) return <AdminLayout><div className="p-8 text-ink-500">Carregando...</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display italic text-3xl text-ink-800">Cidades e Fretes</h1>
            <p className="text-sm text-ink-500 mt-1">{cities.length} cidade(s) cadastrada(s)</p>
          </div>
          <Button
            className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill"
            onClick={() => { setCityForm({ name: '', state: '' }); setCityDialog({ open: true, mode: 'create' }) }}
          >
            + Nova Cidade
          </Button>
        </div>

        <div className="space-y-4">
          {cities.map(city => (
            <div key={city.id} className="bg-white border border-ink-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-ink-50 transition-colors"
                onClick={() => toggleCity(city.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-transform ${expandedCity === city.id ? 'rotate-90' : ''}`}>▶</span>
                  <div>
                    <span className="font-medium text-ink-800">{city.name}, {city.state}</span>
                    <span className="ml-3 text-xs text-lilac-500 bg-lilac-50 px-2 py-0.5 rounded-pill">
                      {city._count.neighborhoods} bairros
                    </span>
                  </div>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setCityForm({ name: city.name, state: city.state })
                      setCityDialog({ open: true, mode: 'edit', city })
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-400 border-red-100 hover:bg-red-50"
                    onClick={() => setDeleteDialog({ open: true, type: 'city', id: city.id, name: city.name })}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {expandedCity === city.id && (
                <div className="border-t border-ink-100 px-5 py-4">
                  <div className="flex justify-end mb-3">
                    <Button
                      size="sm"
                      className="bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill text-xs"
                      onClick={() => {
                        setNeighborForm({ name: '', deliveryFee: '', isActive: true })
                        setNeighborDialog({ open: true, mode: 'create', cityId: city.id })
                      }}
                    >
                      + Novo Bairro
                    </Button>
                  </div>

                  {!neighborhoods[city.id] ? (
                    <p className="text-sm text-ink-500">Carregando...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bairro</TableHead>
                          <TableHead>Frete</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {neighborhoods[city.id].map(n => (
                          <TableRow key={n.id}>
                            <TableCell className="text-sm">{n.name}</TableCell>
                            <TableCell className="text-sm font-medium">{formatPrice(Number(n.deliveryFee))}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-pill ${n.isActive ? 'bg-leaf-500/10 text-leaf-500' : 'bg-ink-100 text-ink-500'}`}>
                                {n.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button
                                  className="text-xs text-lilac-500 hover:text-lilac-600"
                                  onClick={() => {
                                    setNeighborForm({ name: n.name, deliveryFee: String(n.deliveryFee), isActive: n.isActive })
                                    setNeighborDialog({ open: true, mode: 'edit', neighbor: n })
                                  }}
                                >
                                  Editar
                                </button>
                                <span className="text-ink-200">|</span>
                                <button
                                  className="text-xs text-red-400 hover:text-red-500"
                                  onClick={() => setDeleteDialog({ open: true, type: 'neighborhood', id: n.id, name: n.name })}
                                >
                                  Excluir
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog criar/editar cidade */}
      <Dialog open={cityDialog.open} onOpenChange={open => !open && setCityDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{cityDialog.mode === 'create' ? 'Nova Cidade' : 'Editar Cidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Nome</label>
              <Input value={cityForm.name} onChange={e => setCityForm(p => ({ ...p, name: e.target.value }))} placeholder="Nova Friburgo" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Estado</label>
              <Input value={cityForm.state} onChange={e => setCityForm(p => ({ ...p, state: e.target.value }))} placeholder="RJ" maxLength={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialog(p => ({ ...p, open: false }))}>Cancelar</Button>
            <Button className="bg-ink-800 text-white" onClick={handleSaveCity}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog criar/editar bairro */}
      <Dialog open={neighborDialog.open} onOpenChange={open => !open && setNeighborDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{neighborDialog.mode === 'create' ? 'Novo Bairro' : 'Editar Bairro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Nome</label>
              <Input value={neighborForm.name} onChange={e => setNeighborForm(p => ({ ...p, name: e.target.value }))} placeholder="CENTRO" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5 block">Frete (R$)</label>
              <Input type="number" step="0.01" value={neighborForm.deliveryFee} onChange={e => setNeighborForm(p => ({ ...p, deliveryFee: e.target.value }))} placeholder="11.00" />
            </div>
            {neighborDialog.mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={neighborForm.isActive} onChange={e => setNeighborForm(p => ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="isActive" className="text-sm text-ink-600">Ativo</label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeighborDialog(p => ({ ...p, open: false }))}>Cancelar</Button>
            <Button className="bg-ink-800 text-white" onClick={handleSaveNeighbor}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar exclusão */}
      <Dialog open={!!deleteDialog} onOpenChange={open => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink-600 py-2">Excluir <strong>{deleteDialog?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
```

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/services/neighborhoodService.ts frontend/src/pages/admin/AdminFretesPage.tsx
git commit -m "feat(frontend): AdminFretesPage com CRUD de cidades e bairros"
```

---

## Task 7: Frontend — orderService + CheckoutPage (4 steps)

**Files:**
- Create: `frontend/src/services/orderService.ts`
- Modify: `frontend/src/pages/checkout/CheckoutPage.tsx`

- [ ] **Step 1: Criar `frontend/src/services/orderService.ts`**

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
}

export interface OrderResult {
  id: number
  status: string
  total: number
}

export const orderService = {
  async create(payload: CreateOrderPayload): Promise<OrderResult> {
    const { data } = await api.post<OrderResult>('/orders', payload)
    return data
  },
}
```

- [ ] **Step 2: Substituir `frontend/src/pages/checkout/CheckoutPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCartStore, selectTotal } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { neighborhoodService, type City, type Neighborhood } from '@/services/neighborhoodService'
import { orderService } from '@/services/orderService'

type Step = 1 | 2 | 3 | 4

interface AddressData {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

interface ViaCepResponse {
  localidade: string
  uf: string
  logradouro: string
  bairro: string
  erro?: boolean
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

const STEPS = ['Entrega', 'Dados', 'Mensagem', 'Confirmação']

export function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const cartTotal = useCartStore(selectTotal)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [cepInput, setCepInput] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [address, setAddress] = useState<AddressData>({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' })
  const [cities, setCities] = useState<City[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null)
  const [cityMatch, setCityMatch] = useState(false)
  const [customerName, setCustomerName] = useState(user?.name ?? '')
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    neighborhoodService.getCities().then(setCities)
  }, [])

  const handleCepSearch = async () => {
    const cep = cepInput.replace(/\D/g, '')
    if (cep.length !== 8) { setCepError('CEP deve ter 8 dígitos'); return }
    setCepLoading(true)
    setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data: ViaCepResponse = await res.json()
      if (data.erro) { setCepError('CEP não encontrado'); return }

      setAddress({
        cep,
        street: data.logradouro,
        number: '',
        complement: '',
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      })

      // Checar se a cidade bate com alguma cadastrada
      const match = cities.find(c =>
        c.name.toLowerCase() === data.localidade.toLowerCase() &&
        c.state.toLowerCase() === data.uf.toLowerCase()
      )

      if (match) {
        setCityMatch(true)
        const nbhs = await neighborhoodService.getNeighborhoods(match.id)
        setNeighborhoods(nbhs)
      } else {
        setCityMatch(false)
        setNeighborhoods([])
        setSelectedNeighborhood(null)
      }
    } catch {
      setCepError('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setCepLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!selectedNeighborhood) return
    setSubmitting(true)
    try {
      const order = await orderService.create({
        items: items.map(i => ({ productId: i.productId, variantId: i.variantId, qty: i.qty, price: i.price })),
        neighborhoodId: selectedNeighborhood.id,
        deliveryMethod: 'motoboy',
        deliveryMessage: message || undefined,
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
      })
      clearCart()
      navigate(`/pedido/${order.id}`)
    } catch {
      alert('Erro ao criar pedido. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const deliveryFee = selectedNeighborhood ? Number(selectedNeighborhood.deliveryFee) : 0
  const grandTotal = cartTotal + deliveryFee

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-7 py-10">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step
            const active = n === step
            const done = n < step
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${active ? 'text-ink-800' : done ? 'text-leaf-500' : 'text-ink-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-ink-800 text-white' : done ? 'bg-leaf-500 text-white' : 'bg-ink-100'}`}>
                    {done ? '✓' : n}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-ink-200 mx-1" />}
              </div>
            )
          })}
        </div>

        {/* Step 1 — Entrega */}
        {step === 1 && (
          <div>
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Endereço de entrega</h2>

            <div className="flex gap-2 mb-4">
              <Input
                value={cepInput}
                onChange={e => setCepInput(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1"
              />
              <Button
                className="bg-ink-800 hover:bg-lilac-500 text-white rounded-pill"
                onClick={handleCepSearch}
                disabled={cepLoading}
              >
                {cepLoading ? 'Buscando...' : 'Buscar CEP'}
              </Button>
            </div>

            {cepError && <p className="text-xs text-red-400 mb-4">{cepError}</p>}

            {address.city && (
              <div className="bg-ink-50 border border-ink-200 rounded-lg p-4 mb-6 text-sm text-ink-600">
                <strong>{address.street}</strong>, {address.neighborhood}<br />
                {address.city} — {address.state}
              </div>
            )}

            {cityMatch && neighborhoods.length > 0 && (
              <div className="mb-6">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
                  Selecione o bairro
                </label>
                <select
                  className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500/20"
                  value={selectedNeighborhood?.id ?? ''}
                  onChange={e => {
                    const n = neighborhoods.find(nb => nb.id === Number(e.target.value))
                    setSelectedNeighborhood(n ?? null)
                  }}
                >
                  <option value="">Selecione...</option>
                  {neighborhoods.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} — {formatPrice(Number(n.deliveryFee))}
                    </option>
                  ))}
                </select>
                {selectedNeighborhood && (
                  <p className="text-xs text-leaf-500 mt-2">
                    Taxa de entrega: {formatPrice(Number(selectedNeighborhood.deliveryFee))}
                  </p>
                )}
              </div>
            )}

            {address.city && !cityMatch && (
              <div className="bg-petal-100 border border-petal-400/30 rounded-lg p-4 mb-6 text-sm text-ink-600">
                Entrega via <strong>transportadora</strong> — em breve.
              </div>
            )}

            <Button
              className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill"
              disabled={!selectedNeighborhood}
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2 — Dados pessoais */}
        {step === 2 && (
          <div>
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Dados pessoais</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Nome</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Email</label>
                <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Telefone <span className="normal-case font-normal">(opcional)</span></label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(21) 99999-9999" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Rua</label>
                  <Input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Número</label>
                  <Input value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))} placeholder="123" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Complemento <span className="normal-case font-normal">(opcional)</span></label>
                <Input value={address.complement} onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))} placeholder="Apto 42" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-pill" onClick={() => setStep(1)}>Voltar</Button>
              <Button
                className="flex-1 bg-ink-800 hover:bg-lilac-500 text-white rounded-pill"
                disabled={!customerName || !customerEmail}
                onClick={() => setStep(3)}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Mensagem */}
        {step === 3 && (
          <div>
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Mensagem para o cartão</h2>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 120))}
              placeholder="Ex: Feliz aniversário, com muito carinho!"
              className="h-24 resize-none mb-1"
            />
            <p className="text-[10px] text-ink-500 text-right mb-6">{message.length}/120</p>

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">Resumo dos itens</p>
              {items.map(item => (
                <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm text-ink-600 mb-1">
                  <span>{item.productName} ({item.variantName ?? 'Único'}) × {item.qty}</span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-pill" onClick={() => setStep(2)}>Voltar</Button>
              <Button className="flex-1 bg-ink-800 hover:bg-lilac-500 text-white rounded-pill" onClick={() => setStep(4)}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Step 4 — Confirmação */}
        {step === 4 && (
          <div>
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Confirmar pedido</h2>

            <div className="bg-white border border-ink-200 rounded-lg divide-y divide-ink-100 mb-6">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Itens</p>
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm text-ink-600 mb-1">
                    <span>{item.productName} ({item.variantName ?? 'Único'}) × {item.qty}</span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Entrega</p>
                <p className="text-sm text-ink-600">{selectedNeighborhood?.name}</p>
                <p className="text-sm text-ink-600">Taxa: {formatPrice(deliveryFee)}</p>
              </div>
              {message && (
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Mensagem</p>
                  <p className="text-sm text-ink-600 italic">"{message}"</p>
                </div>
              )}
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-ink-800">Total</span>
                <span className="font-display italic text-2xl text-ink-800">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-pill" onClick={() => setStep(3)}>Voltar</Button>
              <Button
                className="flex-1 bg-ink-800 hover:bg-lilac-500 text-white rounded-pill"
                disabled={submitting}
                onClick={handleFinalize}
              >
                {submitting ? 'Finalizando...' : 'Finalizar pedido'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/services/orderService.ts frontend/src/pages/checkout/CheckoutPage.tsx
git commit -m "feat(frontend): CheckoutPage 4 steps com ViaCEP e criacao de pedido"
```

---

## Task 8: Frontend — OrderConfirmationPage + App.tsx

**Files:**
- Create: `frontend/src/pages/checkout/OrderConfirmationPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Criar `frontend/src/pages/checkout/OrderConfirmationPage.tsx`**

```tsx
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()

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

- [ ] **Step 2: Substituir `frontend/src/App.tsx` na íntegra**

```tsx
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { StorePage } from '@/pages/store/StorePage'
import { ProductPage } from '@/pages/store/ProductPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { CheckoutPage } from '@/pages/checkout/CheckoutPage'
import { OrderConfirmationPage } from '@/pages/checkout/OrderConfirmationPage'
import { ContaPage } from '@/pages/account/ContaPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminFretesPage } from '@/pages/admin/AdminFretesPage'
import { PrivateRoute } from '@/components/features/PrivateRoute'
import { AdminRoute } from '@/components/features/AdminRoute'

function HomePage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-24 text-center">
        <h1 className="font-display italic text-5xl text-lilac-500 mb-3">Frésia Flores</h1>
        <p className="text-ink-500 mb-8">Flores com alma, entregues com carinho.</p>
        <a href="/loja" className="inline-block bg-ink-800 hover:bg-lilac-500 text-white text-sm font-medium px-6 py-3 rounded-pill transition-colors">
          Ver nossa loja
        </a>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/loja" element={<StorePage />} />
      <Route path="/produto/:slug" element={<ProductPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
      <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
      <Route path="/conta" element={<PrivateRoute><ContaPage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/fretes" element={<AdminRoute><AdminFretesPage /></AdminRoute>} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verificar tipagem completa**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/pages/checkout/OrderConfirmationPage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): OrderConfirmationPage e rotas admin/pedido"
```

---

## Task 9: Verificação e2e

- [ ] **Step 1: Login como admin**

Abrir `http://localhost:5173/login`, logar com `constantino.dev.br@gmail.com`.
Header deve mostrar dropdown de conta.

- [ ] **Step 2: Acessar admin de fretes**

Navegar para `http://localhost:5173/admin/fretes`.
Esperado: accordion com "Nova Friburgo, RJ" e "109 bairros".

- [ ] **Step 3: Expandir bairros**

Clicar em Nova Friburgo → tabela com todos os bairros, nomes e taxas.

- [ ] **Step 4: Criar novo bairro**

Clicar "+ Novo Bairro" → preencher "TESTE" com frete R$ 10 → Salvar.
Esperado: bairro aparece na tabela.

- [ ] **Step 5: Editar e remover bairro teste**

Editar "TESTE" → alterar frete → Salvar. Depois excluir.
Esperado: tabela atualizada.

- [ ] **Step 6: Testar checkout**

Adicionar produto ao carrinho. Ir para `/checkout`.
Digitar CEP de Nova Friburgo (ex: `28625-000`) → buscar.
Esperado: endereço preenchido, dropdown de bairros aparece.

- [ ] **Step 7: Finalizar pedido**

Selecionar bairro → continuar → preencher dados → mensagem → confirmar → finalizar.
Esperado: `/pedido/{id}` com confirmação e número do pedido.

- [ ] **Step 8: Verificar no banco**

```bash
"C:/xampp/mysql/bin/mysql.exe" -u root fresia -e "SELECT id, customerName, neighborhoodId, total, status FROM orders ORDER BY id DESC LIMIT 1;"
```

Esperado: 1 linha com o pedido recém-criado.

- [ ] **Step 9: Commit final**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add -A
git commit -m "chore: verificacao e2e session 6 concluida"
```

---

## Self-Review

- [x] **Spec coverage:** Schema (Task 1), Seed com 109 bairros (Task 2), adminMiddleware + services (Task 3), controllers + routes + server (Task 4), AdminRoute + AdminLayout + shadcn (Task 5), AdminFretesPage CRUD (Task 6), orderService + CheckoutPage 4 steps (Task 7), OrderConfirmationPage + App.tsx (Task 8), e2e (Task 9)
- [x] **Sem placeholders:** código completo em todos os steps
- [x] **Consistência de tipos:** `Neighborhood.deliveryFee` é `Decimal` no Prisma mas `number` nos services — cast via `Number()` feito explicitamente em `orderService.create` e no frontend
- [x] **ViaCEP direto do frontend** — API pública, sem chave, sem proxy necessário
- [x] **`selectTotal` do cartStore** importado corretamente — definido na Sessão 4
- [x] **`clearCart()`** chamado no checkout após pedido criado — definido na Sessão 4
- [x] **`Order.customerName/Email/Phone`** adicionados ao schema e ao `orderService.create` — correspondência total
