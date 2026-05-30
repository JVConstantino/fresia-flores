# Progresso de Implementação — Frésia Admin CRUD

> Última atualização: 2026-05-02
> Este arquivo é atualizado a cada etapa concluída para permitir retomada após reset de sessão.

---

## Status Geral

| Plano | Descrição | Status |
|-------|-----------|--------|
| 01 | Auth middleware fix (server.ts) | ✅ Concluído |
| 02 | ProductForm active→isActive + refetch + validação | ✅ Concluído |
| 03 | Categorias admin backend | ✅ Concluído |
| 04 | Promoções admin (verificar + fix toggleProduct) | ✅ Concluído |
| 05 | Pedidos admin backend | ✅ Concluído |
| 06 | Newsletter admin (auth + verificar) | ✅ Concluído |
| 07 | Stats admin (auth + withCredentials fix) | ✅ Concluído |
| 08 | Limpeza final (Prisma singleton, controllers cleanup) | ✅ Concluído |

---

## Detalhes das Correções

### Plano 01 — Auth Middleware Fix ✅
- `server.ts` já estava correto com `authMiddleware, adminMiddleware` em todas as rotas admin.

### Plano 02 — Produtos Admin ✅
- `ProductForm.tsx`: campo `active` → `isActive` (schema Zod, default values, reset, Checkbox)
- `ProductList.tsx`: coluna `active` → `isActive`, render de categoria corrigido para `categoryName`
- `adminProductService.ts` (backend): validação de campos obrigatórios com statusCode 400, slugify com normalização NFD

### Plano 03 — Categorias Admin ✅
- `adminCategoryService.ts` e `adminCategoryController.ts` já existiam no backend.
- Frontend `CategoryList.tsx`: corrigido para aceitar resposta array (backend retorna array, não {data})
- Coluna `createdAt` removida (Category não tem createdAt no schema) → substituída por count de produtos.
- `ProductForm.tsx`: corrigido loadCategories para aceitar array ou {data}.

### Plano 04 — Promoções Admin ✅
- Controller reescrito sem adminMiddleware duplicado.
- `PromotionForm.tsx`: corrigido bug no `toggleProduct` que passava array antigo ao `setValue`.

### Plano 05 — Pedidos Admin ✅
- `adminOrderService.ts` e `adminOrderController.ts` já existiam no backend.
- Frontend `OrderList.tsx`: corrigido para ler `result.items` (formato do backend) em vez de `result.data`.
- Modal de status: agora usa Select controlado, botão envia status selecionado (não mais hardcoded 'confirmed').

### Plano 06 — Newsletter Admin ✅
- Rota já registrada com `authMiddleware, adminMiddleware` no `server.ts`.

### Plano 07 — Stats Admin ✅
- Controller reescrito sem adminMiddleware duplicado.
- `adminStatsService.ts` (frontend): corrigido para usar `withCredentials: true` e `getCookie`.
- `useStats.ts`: agora usa `adminStatsService` em vez de axios direto sem credenciais.

### Plano 08 — Limpeza ✅
- **PrismaClient singleton**: `prisma/client.ts` atualizado com padrão global var para dev.
- **7 services** migrados de `new PrismaClient()` para `import { prisma } from '@/prisma/client'`:
  authService, categoryService, cityService, neighborhoodService, orderService, paymentService, productService.
- **3 controllers** limpos de adminMiddleware duplicado: adminProductController, adminPromotionController, adminStatsController.
- Todos agora delegam erros via `next(err)` ao errorHandler centralizado.

---

## Contexto para Retomada

- Backend: `localhost:4000` via `npx tsx src/server.ts` na pasta `backend/`
- Frontend: `localhost:5173` via `npm run dev` na pasta `frontend/`
- Admin: `constantino.dev.br@gmail.com` / `Lets291224#`
- DB: MySQL `fresia` em `localhost:3306`
- Pasta do projeto: `C:\Users\Constantino\Documents\PROGRAMACAO\FRESIA\PLANO-NOVO\fresia-claude-setup\fresia\`
