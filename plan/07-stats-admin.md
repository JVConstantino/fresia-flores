# Plano 07 — Estatísticas Admin

> **Prioridade:** 🟡 P1
> **Dependências:** Plano 01

---

## Contexto

`adminStatsController.ts` existe e expõe `GET /api/v1/admin/stats/overview`. `useStats.ts` no frontend consome. Após Plano 01, deve funcionar.

---

## Ações

### A. Verificar `adminStatsController.ts`
- O endpoint `/overview` retorna `{ totalSales, salesChange, totalOrders, ordersChange, activeCustomers, lowStockProducts }`.
- Confirmar queries Prisma:
  - `totalSales` = soma de `total` dos pedidos `delivered` ou `confirmed` no período (últimos 30d).
  - `salesChange` = variação percentual vs período anterior.
  - `totalOrders` = count de pedidos no período.
  - `activeCustomers` = users que fizeram pedido nos últimos 90d.
  - `lowStockProducts` = count de produtos com `stock < 5` (ou similar).

### B. (Opcional) Endpoints adicionais
Se o `AdminDashboard.tsx` consome `salesChart`, `revenueByCategory`, `topProducts`, `ordersStatus` — criar endpoints:
- `GET /api/v1/admin/stats/sales-chart?period=7d|30d|year`
- `GET /api/v1/admin/stats/top-products?limit=5`
- `GET /api/v1/admin/stats/orders-by-status`

Hoje o `useStats.ts` tem dados estáticos como fallback. Deixar assim por ora se não for prioridade.

---

## Verificação

1. Login admin → `/admin` → KPIs aparecem com valores reais.
2. `curl -b cookies.txt http://localhost:4000/api/v1/admin/stats/overview` → JSON com 6 campos.
