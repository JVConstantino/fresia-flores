# Sessão 1 — Setup Inicial do Monorepo Frésia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ter o monorepo Frésia rodando localmente com frontend React+Vite+shadcn, backend Express+Prisma e MySQL via Docker — verificado com `npm run dev` nos dois lados e `prisma migrate dev` sem erros.

**Architecture:** Monorepo com `frontend/` e `backend/` dentro de `fresia/`. MySQL roda em Docker na porta 3306. Frontend em Vite na porta 5173 com proxy `/api/*` apontando para o backend na porta 3001. Backend em Express 5 com TypeScript executado via `tsx`.

**Tech Stack:** React 18, Vite 5, Tailwind CSS v4, shadcn/ui, Node.js, Express 5, TypeScript, Prisma, MySQL 8.0, Docker, npm.

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `fresia/.gitignore` | Ignora node_modules, .env, dist |
| Criar | `fresia/docker-compose.yml` | MySQL 8.0 na porta 3306 |
| Criar | `fresia/.env` | MYSQL_ROOT_PASSWORD |
| Criar | `fresia/backend/package.json` | Deps Node: express, prisma, tsx, typescript |
| Criar | `fresia/backend/tsconfig.json` | Config TypeScript do backend |
| Criar | `fresia/backend/.env` | DATABASE_URL, PORT, JWT_SECRET |
| Criar | `fresia/backend/.env.example` | Template sem valores |
| Criar | `fresia/backend/.gitignore` | node_modules, .env, dist |
| Criar | `fresia/backend/prisma/schema.prisma` | Todas as entidades do MVP |
| Criar | `fresia/backend/src/middlewares/errorHandler.ts` | Middleware de erro centralizado |
| Criar | `fresia/backend/src/server.ts` | Entry point Express 5 |
| Criar | `fresia/frontend/package.json` | Deps React: vite, react, tailwind, shadcn |
| Criar | `fresia/frontend/tsconfig.json` | Config TypeScript do frontend |
| Criar | `fresia/frontend/vite.config.ts` | Proxy /api → localhost:3001 |
| Criar | `fresia/frontend/tailwind.config.ts` | Tokens Frésia |
| Criar | `fresia/frontend/postcss.config.js` | PostCSS com Tailwind |
| Criar | `fresia/frontend/components.json` | Config shadcn |
| Criar | `fresia/frontend/index.html` | HTML com Google Fonts |
| Criar | `fresia/frontend/src/lib/utils.ts` | Helper cn() do shadcn |
| Criar | `fresia/frontend/src/main.tsx` | Entry point React |
| Criar | `fresia/frontend/src/App.tsx` | Componente raiz temporário |

---

## Task 1: Git e Estrutura Raiz

**Files:**
- Create: `fresia-claude-setup/fresia/.gitignore`
- Create: `fresia-claude-setup/fresia/.env`
- Create: `fresia-claude-setup/fresia/docker-compose.yml`

> Todos os comandos são executados a partir de `fresia-claude-setup/fresia/` salvo indicação contrária.

- [ ] **Step 1: Inicializar repositório git**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git init
```

Esperado: `Initialized empty Git repository in .../fresia/.git/`

- [ ] **Step 2: Criar `.gitignore` raiz**

```
node_modules/
dist/
.env
*.local
.DS_Store
```

Salvar em: `fresia-claude-setup/fresia/.gitignore`

- [ ] **Step 3: Criar `.env` raiz (variáveis do Docker)**

```
MYSQL_ROOT_PASSWORD=fresia_dev_2026
```

Salvar em: `fresia-claude-setup/fresia/.env`

- [ ] **Step 4: Criar `docker-compose.yml`**

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: fresia
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Salvar em: `fresia-claude-setup/fresia/docker-compose.yml`

- [ ] **Step 5: Subir o MySQL e verificar**

```bash
docker compose up -d
docker compose ps
```

Esperado: container `fresia-mysql-1` com status `running`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore docker-compose.yml
git commit -m "chore: init repo e docker mysql"
```

---

## Task 2: Backend — Scaffold e Dependências

**Files:**
- Create: `fresia-claude-setup/fresia/backend/package.json`
- Create: `fresia-claude-setup/fresia/backend/tsconfig.json`
- Create: `fresia-claude-setup/fresia/backend/.env`
- Create: `fresia-claude-setup/fresia/backend/.env.example`
- Create: `fresia-claude-setup/fresia/backend/.gitignore`

- [ ] **Step 1: Criar `backend/package.json`**

```json
{
  "name": "fresia-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.1",
    "express-validator": "^7.2.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.10.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^6.4.17",
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

Salvar em: `fresia-claude-setup/fresia/backend/package.json`

- [ ] **Step 2: Criar `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Salvar em: `fresia-claude-setup/fresia/backend/tsconfig.json`

- [ ] **Step 3: Criar `backend/.env`**

```
DATABASE_URL="mysql://root:fresia_dev_2026@localhost:3306/fresia"
JWT_SECRET=fresia_jwt_secret_dev_change_in_prod
PORT=3001
```

Salvar em: `fresia-claude-setup/fresia/backend/.env`

- [ ] **Step 4: Criar `backend/.env.example`**

```
DATABASE_URL="mysql://root:SENHA@localhost:3306/fresia"
JWT_SECRET=
PORT=3001
```

Salvar em: `fresia-claude-setup/fresia/backend/.env.example`

- [ ] **Step 5: Criar `backend/.gitignore`**

```
node_modules/
dist/
.env
```

Salvar em: `fresia-claude-setup/fresia/backend/.gitignore`

- [ ] **Step 6: Instalar dependências**

```bash
cd backend
npm install
```

Esperado: `node_modules/` criado, sem erros de peer deps.

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/package.json backend/tsconfig.json backend/.env.example backend/.gitignore
git commit -m "chore(backend): scaffold inicial com dependencias"
```

---

## Task 3: Backend — Prisma Schema

**Files:**
- Create: `fresia-claude-setup/fresia/backend/prisma/schema.prisma`

- [ ] **Step 1: Inicializar Prisma**

```bash
cd backend
npx prisma init --datasource-provider mysql
```

Isso cria `prisma/schema.prisma` com datasource mysql. Vamos substituir o conteúdo inteiro.

- [ ] **Step 2: Substituir `backend/prisma/schema.prisma` pelo schema completo**

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

model Neighborhood {
  id          Int     @id @default(autoincrement())
  name        String
  deliveryFee Decimal @db.Decimal(10, 2)
  orders      Order[]
}

model Order {
  id              Int          @id @default(autoincrement())
  userId          Int
  status          String       @default("pending")
  total           Decimal      @db.Decimal(10, 2)
  deliveryMessage String?      @db.Text
  neighborhoodId  Int
  paymentId       String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  user            User         @relation(fields: [userId], references: [id])
  neighborhood    Neighborhood @relation(fields: [neighborhoodId], references: [id])
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

Salvar em: `fresia-claude-setup/fresia/backend/prisma/schema.prisma`

- [ ] **Step 3: Rodar a migration**

```bash
npx prisma migrate dev --name init
```

Esperado: `Your database is now in sync with your schema.` e pasta `prisma/migrations/` criada.

- [ ] **Step 4: Verificar tabelas no banco**

```bash
npx prisma studio
```

Deve abrir o browser com as tabelas: User, Address, Category, Product, ProductVariant, Neighborhood, Order, OrderItem, Setting. Fechar o studio após verificar.

- [ ] **Step 5: Commit**

```bash
cd ..
git add backend/prisma/
git commit -m "feat(backend): prisma schema completo com migration init"
```

---

## Task 4: Backend — Express Server

**Files:**
- Create: `fresia-claude-setup/fresia/backend/src/middlewares/errorHandler.ts`
- Create: `fresia-claude-setup/fresia/backend/src/server.ts`

- [ ] **Step 1: Criar `backend/src/middlewares/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500
  const message = err.message ?? 'Internal Server Error'

  res.status(statusCode).json({ error: message })
}
```

Salvar em: `fresia-claude-setup/fresia/backend/src/middlewares/errorHandler.ts`

- [ ] **Step 2: Criar `backend/src/server.ts`**

```typescript
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
```

Salvar em: `fresia-claude-setup/fresia/backend/src/server.ts`

- [ ] **Step 3: Rodar o backend e verificar**

```bash
cd backend
npm run dev
```

Em outro terminal:
```bash
curl http://localhost:3001/api/v1/health
```

Esperado: `{"status":"ok","ts":1234567890123}`

- [ ] **Step 4: Commit**

```bash
cd ..
git add backend/src/
git commit -m "feat(backend): express server com health endpoint"
```

---

## Task 5: Frontend — Scaffold Vite + React

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/package.json`
- Create: `fresia-claude-setup/fresia/frontend/tsconfig.json`
- Create: `fresia-claude-setup/fresia/frontend/index.html`
- Create: `fresia-claude-setup/fresia/frontend/src/main.tsx`
- Create: `fresia-claude-setup/fresia/frontend/src/App.tsx`

- [ ] **Step 1: Criar `frontend/package.json`**

```json
{
  "name": "fresia-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.469.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^5.4.14"
  }
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/package.json`

- [ ] **Step 2: Criar `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/tsconfig.json`

- [ ] **Step 3: Criar `frontend/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/tsconfig.node.json`

- [ ] **Step 4: Criar `frontend/index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
    <title>Frésia Flores</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Salvar em: `fresia-claude-setup/fresia/frontend/index.html`

- [ ] **Step 5: Criar `frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/main.tsx`

- [ ] **Step 6: Criar `frontend/src/App.tsx`**

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-4xl italic text-lilac-500 mb-2">
          Frésia Flores
        </h1>
        <p className="text-ink-500 font-body">Setup concluído</p>
      </div>
    </div>
  )
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/App.tsx`

- [ ] **Step 7: Instalar dependências**

```bash
cd frontend
npm install
```

Esperado: `node_modules/` criado sem erros.

- [ ] **Step 8: Commit**

```bash
cd ..
git add frontend/package.json frontend/tsconfig.json frontend/tsconfig.node.json frontend/index.html frontend/src/
git commit -m "chore(frontend): scaffold vite + react + typescript"
```

---

## Task 6: Frontend — Tailwind + Tokens Frésia

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/tailwind.config.ts`
- Create: `fresia-claude-setup/fresia/frontend/postcss.config.js`
- Create: `fresia-claude-setup/fresia/frontend/vite.config.ts`
- Create: `fresia-claude-setup/fresia/frontend/src/index.css`

- [ ] **Step 1: Criar `frontend/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/postcss.config.js`

- [ ] **Step 2: Criar `frontend/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lilac: {
          50:  '#f5f0fb',
          100: '#ece3f7',
          500: '#9b83e6',
          600: '#8970d9',
        },
        petal: {
          100: '#fde9e3',
          400: '#f5a98c',
        },
        leaf: {
          500: '#5a9e68',
        },
        ink: {
          50:  '#f9f8fc',
          100: '#f3f1f8',
          200: '#e8e4ef',
          500: '#6b6579',
          800: '#1f1c26',
        },
      },
      borderRadius: {
        md:   '10px',
        lg:   '16px',
        pill: '9999px',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

Salvar em: `fresia-claude-setup/fresia/frontend/tailwind.config.ts`

- [ ] **Step 3: Criar `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-body text-ink-800 bg-ink-50;
  }
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/index.css`

- [ ] **Step 4: Criar `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

Salvar em: `fresia-claude-setup/fresia/frontend/vite.config.ts`

- [ ] **Step 5: Verificar frontend com Tailwind**

```bash
cd frontend
npm run dev
```

Abrir `http://localhost:5173` no browser. Esperado: fundo cor `#f9f8fc` (ink-50), título "Frésia Flores" em roxo lilac, texto "Setup concluído" em cinza.

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/tailwind.config.ts frontend/postcss.config.js frontend/vite.config.ts frontend/src/index.css
git commit -m "feat(frontend): tailwind com tokens fresia"
```

---

## Task 7: Frontend — shadcn/ui Setup

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/components.json`
- Create: `fresia-claude-setup/fresia/frontend/src/lib/utils.ts`

- [ ] **Step 1: Criar `frontend/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": false,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/components.json`

- [ ] **Step 2: Criar `frontend/src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/lib/utils.ts`

- [ ] **Step 3: Criar estrutura de pastas shadcn**

```bash
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/layout
mkdir -p frontend/src/components/features
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p frontend/src/store
mkdir -p frontend/src/pages/store
mkdir -p frontend/src/pages/checkout
mkdir -p frontend/src/pages/account
mkdir -p frontend/src/pages/admin
```

- [ ] **Step 4: Verificar que o shadcn CLI funciona**

```bash
cd frontend
npx shadcn@latest --version
```

Esperado: versão impressa sem erro (ex: `shadcn-ui/2.x.x`).

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/components.json frontend/src/lib/ frontend/src/components/ frontend/src/hooks/ frontend/src/services/ frontend/src/store/ frontend/src/pages/
git commit -m "feat(frontend): shadcn setup e estrutura de pastas"
```

---

## Task 8: Verificação End-to-End

- [ ] **Step 1: Confirmar MySQL rodando**

```bash
docker compose ps
```

Esperado: `fresia-mysql-1` com status `running (healthy)` ou `running`.

- [ ] **Step 2: Confirmar backend rodando**

Com o backend em execução (`npm run dev` na pasta `backend/`):

```bash
curl http://localhost:3001/api/v1/health
```

Esperado: `{"status":"ok","ts":1234567890123}`

- [ ] **Step 3: Confirmar proxy do frontend**

Com o frontend em execução (`npm run dev` na pasta `frontend/`), abrir o console do browser em `http://localhost:5173` e rodar:

```js
fetch('/api/v1/health').then(r => r.json()).then(console.log)
```

Esperado: `{status: 'ok', ts: 1234567890123}` no console — confirma que o proxy Vite → Express está funcionando.

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "chore: verificacao e2e session 1 concluida"
```

---

## Self-Review

- [x] **Spec coverage:** docker-compose (Task 1), backend deps+config (Task 2), Prisma schema (Task 3), Express server+health (Task 4), Vite+React scaffold (Task 5), Tailwind+tokens (Task 6), shadcn setup (Task 7), verificação e2e (Task 8)
- [x] **Sem placeholders:** todos os steps têm código completo
- [x] **Consistência:** porta 3001 usada em server.ts, vite.config.ts e curl commands; `DATABASE_URL` bate com docker-compose password; `ink-50` em App.tsx existe no tailwind.config.ts
- [x] **path `@/*`:** definido no tsconfig.json paths e no vite.config.ts alias — consistente em ambos
