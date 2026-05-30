# Plano 02 — Produtos Admin

> **Prioridade:** 🔴 P0
> **Dependências:** Plano 01 (auth middleware)

---

## Contexto

Backend tem controller, service e endpoints completos (`GET`, `POST`, `PUT`, `DELETE`, `batch-delete`). Frontend tem `ProductList` e `ProductForm`. **Após o Plano 01**, a rota é alcançável. Restam 3 ajustes:

1. **`ProductForm` envia campo `active` mas backend espera `isActive`.**
2. **`ProductList` não dá refetch após delete/edit** — o usuário precisa recarregar a página para ver a mudança.
3. **Validação de payload no backend é fraca** — campos obrigatórios faltando geram 500 do Prisma em vez de 400 amigável.

---

## Arquivos

### A. `frontend/src/pages/admin/products/ProductForm.tsx`
- Renomear o campo `active` → `isActive` (no `register`, no payload do submit, no default value).
- Garantir que `price` é convertido para `number` antes de enviar (ou string que o backend faz `Number()` — confirmar `adminProductService.ts` backend).
- Garantir que `categoryId` é `number`.

### B. `frontend/src/pages/admin/products/ProductList.tsx`
- Após `delete()` ou `batchDelete()`, chamar `getAll()` novamente e atualizar estado.
- Padrão: `await adminProductService.delete(id); await refetch();`

### C. `backend/src/services/adminProductService.ts`
- Em `create()`: validar campos obrigatórios (`name`, `slug`, `price`, `categoryId`). Se faltar, lançar erro com `statusCode: 400` e mensagem clara.
- Em `update()`: validar mesmos campos quando presentes.
- Garantir que `slug` é gerado a partir do `name` se não fornecido (slugify).

### D. `frontend/src/services/adminProductService.ts`
- Verificar que `withCredentials: true` está no `axios.create`. Se sim, OK.
- O interceptor que tenta ler `document.cookie` e setar `Authorization` pode ser removido (cookie é HttpOnly, leitura sempre vazia). Mas não é bloqueador.

---

## Verificação

1. Login admin → `/admin/produtos/novo` → preencher form → salvar → produto aparece na lista sem reload.
2. Editar produto existente → salvar → mudança aparece.
3. Deletar → some da lista.
4. Produto criado aparece na home pública (depende de `isActive: true`).
5. `curl` direto:
   ```bash
   curl -b cookies.txt -X POST http://localhost:4000/api/v1/admin/products \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Flower","slug":"test-flower","price":99.9,"stock":10,"categoryId":5,"isActive":true}'
   ```
   Esperado: `201` com produto criado.
