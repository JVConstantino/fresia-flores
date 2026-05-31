# Plano 04 — Promoções Admin

> **Prioridade:** 🟡 P1
> **Dependências:** Plano 01 (auth middleware)

---

## Contexto

Backend tem `adminPromotionController.ts` e `adminPromotionService.ts` completos. Frontend tem `PromotionList.tsx` e `PromotionForm.tsx`. **Após o Plano 01**, deve funcionar. Verificar se há ajustes.

---

## Possíveis Ajustes

### A. `backend/src/services/adminPromotionService.ts`
Confirmar:
- Validação `validFrom < validTo` retorna 400 amigável.
- `discountType` aceita só `'percentage'` ou `'fixed'`.
- `productIds` é um array — se vazio, decidir se permite (promoção sem produtos = global) ou rejeita.

### B. `frontend/src/pages/admin/promotions/PromotionForm.tsx`
- `validFrom` / `validTo` são `<input type="datetime-local">` — ao enviar, converter para ISO string.
- `productIds` é multi-select ou checklist — confirmar que envia array de números.

### C. `frontend/src/pages/admin/promotions/PromotionList.tsx`
- Refetch após delete.
- Toggle `isActive` (se houver) faz `PUT` parcial.

---

## Verificação

1. Login admin → `/admin/promocoes` → lista.
2. Criar promoção 20% off em um produto, válida hoje–30d → salvar.
3. Visitar página pública do produto → deve mostrar preço com desconto (depende de como o frontend público consome `/promotions/active`).
4. `curl`:
   ```bash
   curl -b cookies.txt http://localhost:4000/api/v1/admin/promotions
   ```
   Esperado: `200` com lista.
