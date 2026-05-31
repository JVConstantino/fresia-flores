# Plano 08 — Limpeza & Verificação Final

> **Prioridade:** 🟢 P2
> **Dependências:** Planos 01–07

---

## Contexto

Após corrigir todos os módulos, fechar débitos técnicos e executar smoke test E2E.

---

## Ações

### A. Singleton do PrismaClient
Vários services fazem `const prisma = new PrismaClient()` — múltiplas conexões abertas. Padronizar em `backend/src/prisma/client.ts`:

```ts
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma = global.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
```

Substituir em todos os services:
- `categoryService.ts`
- `authService.ts`
- `orderService.ts`
- (qualquer outro com `new PrismaClient()`)

### B. Remover interceptor `Authorization: Bearer` redundante
Cookie é HttpOnly — `document.cookie` nunca lê. Em todos os admin services do frontend, manter só `withCredentials: true`. Não bloqueador, mas limpa.

### C. TypeScript check
```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```
Resolver erros que aparecerem (provavelmente em `req.params.id as string` e tipos do Prisma).

### D. Build de produção (sanity)
```bash
cd frontend && npm run build
cd backend && npm run build
```
Sem erros.

### E. Smoke Test E2E (manual)
Roteiro completo:

1. Backend up (`npx tsx src/server.ts`) e frontend up (`npm run dev`).
2. Abrir `http://localhost:5173` (anon):
   - Home carrega categorias, produtos, depoimentos.
   - Inscrever-se na newsletter → success message.
   - Adicionar produto ao carrinho → carrinho atualiza.
3. Login admin (`constantino.dev.br@gmail.com` / `Lets291224#`):
   - Dashboard mostra KPIs.
4. CRUD em ordem:
   - Criar categoria "Tropical".
   - Criar produto "Helicônia" na categoria Tropical → aparece na home.
   - Editar produto → mudança reflete na home.
   - Criar promoção 15% no produto, válida hoje–7d → preço com desconto na home.
   - Logout → fazer pedido como cliente normal.
   - Voltar como admin → ver pedido em `/admin/pedidos` → mudar para `confirmed`.
   - Cliente em `/conta` vê status `confirmed`.
   - Em `/admin/depoimentos` criar e ativar depoimento → aparece na home.
   - Em `/admin/newsletter` ver email cadastrado, exportar CSV.
5. Console do browser e log do backend sem erros.

---

## Critério de Sucesso

- [ ] Todos os 8 módulos admin funcionando.
- [ ] `tsc --noEmit` zero erros backend e frontend.
- [ ] Smoke test E2E passa fim a fim.
- [ ] Sem erros 401/403/404/500 inesperados durante o fluxo.
