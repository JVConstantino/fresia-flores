# Plano 06 — Newsletter Admin

> **Prioridade:** 🟡 P1
> **Dependências:** Plano 01 (auth middleware)

---

## Contexto

`backend/src/routes/admin/newsletter.ts` existe e expõe `GET /api/v1/admin/newsletter` e `DELETE /api/v1/admin/newsletter/:id`. Frontend já tem `NewsletterPage.tsx` e service.

**Problema atual:** rota está sem `authMiddleware` → qualquer um pode listar emails. **Crítico de segurança.**

---

## Ações

### A. Confirmar registro em `server.ts`
Verificar se a linha existe — se não, adicionar:
```ts
import adminNewsletterRouter from './routes/admin/newsletter'
// ...
app.use('/api/v1/admin/newsletter', authMiddleware, adminMiddleware, adminNewsletterRouter)
```

### B. Verificar `routes/admin/newsletter.ts`
- Se há `adminMiddleware` interno duplicado, pode remover (já aplicado no `server.ts`).
- Confirmar que `GET` aceita paginação (`page`, `pageSize`) — frontend espera.

### C. Frontend `NewsletterPage.tsx`
- Refetch após delete.
- Botão "Exportar CSV" usa `DataTable` `exportable` (já implementado).

---

## Verificação

1. Sem login: `curl http://localhost:4000/api/v1/admin/newsletter` → `401`.
2. Login admin → `/admin/newsletter` → lista subscribers.
3. Inscrever email pelo footer público → aparece no admin.
4. Deletar do admin → some.
5. Exportar CSV → arquivo baixa com colunas Email + Data.
