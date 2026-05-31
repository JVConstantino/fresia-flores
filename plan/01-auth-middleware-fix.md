# Plano 01 — Corrigir Middleware Auth nas Rotas Admin

> **Prioridade:** 🔴 P0 — desbloqueia 4 módulos de uma vez
> **Tempo estimado:** 5 min
> **Dependências:** nenhuma

---

## Contexto

`adminMiddleware` lê `req.user`, mas `req.user` só é populado por `authMiddleware`. As rotas admin de **products / promotions / stats / newsletter** estão registradas em `server.ts` **sem** passar por `authMiddleware` antes — então `req.user === undefined` e `adminMiddleware` retorna `403 "Acesso negado"`.

A solução é o padrão já usado em `/admin/cities` e `/admin/neighborhoods`:
```ts
app.use('/api/v1/admin/X', authMiddleware, adminMiddleware, controllerX)
```

Como o `adminMiddleware` é aplicado também **dentro** dos controllers (`adminProductController`, `adminPromotionController`), aplicá-lo de novo na rota seria redundante mas inócuo. Para manter consistência, vamos **manter o `adminMiddleware` no `server.ts`** e **remover de dentro dos controllers** (ou deixar — é idempotente). O importante é o `authMiddleware`.

---

## Arquivo a Modificar

`backend/src/server.ts` — linhas 48-50

### Antes
```ts
app.use('/api/v1/admin/promotions', adminPromotionController)
app.use('/api/v1/admin/stats', adminStatsController)
app.use('/api/v1/admin/products', adminProductController)
```

### Depois
```ts
app.use('/api/v1/admin/promotions', authMiddleware, adminMiddleware, adminPromotionController)
app.use('/api/v1/admin/stats', authMiddleware, adminMiddleware, adminStatsController)
app.use('/api/v1/admin/products', authMiddleware, adminMiddleware, adminProductController)
```

E na linha do newsletter (atualmente `app.use('/api/v1/admin/newsletter', adminNewsletterRouter)` — verificar se está listada; se não estiver, registrar):
```ts
app.use('/api/v1/admin/newsletter', authMiddleware, adminMiddleware, adminNewsletterRouter)
```

> ⚠️ Observação: a inspeção mostrou que `adminNewsletterRouter` é importado mas pode não estar registrado em `server.ts`. Verificar antes de editar.

---

## Verificação

1. Reiniciar backend (`npx tsx src/server.ts`).
2. Tentar acessar admin **sem login**:
   ```bash
   curl -i http://localhost:4000/api/v1/admin/products
   ```
   Esperado: `401 Não autorizado` (e não mais `403`).
3. Login e acessar com cookie:
   ```bash
   curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"constantino.dev.br@gmail.com","password":"Lets291224#"}'
   curl -b cookies.txt http://localhost:4000/api/v1/admin/products
   ```
   Esperado: `200` com lista de produtos paginada.
4. No frontend, fazer login admin → acessar `/admin/produtos` → deve listar produtos.
