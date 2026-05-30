# Plano 03 — Categorias Admin (Criar Backend)

> **Prioridade:** 🔴 P0
> **Dependências:** nenhuma (cria estrutura nova)

---

## Contexto

Frontend já tem `CategoryList.tsx` e `adminCategoryService.ts` que chamam:
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/:id`
- `DELETE /api/v1/admin/categories/:id`

Backend só tem `GET /api/v1/categories` (público, em `categoryService.findAll()`). Falta criar tudo o lado admin.

---

## Arquivos a Criar

### A. `backend/src/services/adminCategoryService.ts`

```ts
import { prisma } from '@/prisma/client'

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const adminCategoryService = {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
  },

  async create(data: { name: string; slug?: string; image?: string }) {
    if (!data.name) throw Object.assign(new Error('Nome obrigatório'), { statusCode: 400 })
    const slug = data.slug || slugify(data.name)
    const exists = await prisma.category.findUnique({ where: { slug } })
    if (exists) throw Object.assign(new Error('Slug já existe'), { statusCode: 409 })
    return prisma.category.create({ data: { name: data.name, slug, image: data.image ?? null } })
  },

  async update(id: number, data: { name?: string; slug?: string; image?: string }) {
    return prisma.category.update({ where: { id }, data })
  },

  async delete(id: number) {
    const products = await prisma.product.count({ where: { categoryId: id } })
    if (products > 0) throw Object.assign(new Error('Categoria possui produtos'), { statusCode: 409 })
    return prisma.category.delete({ where: { id } })
  },
}
```

> Confirmar campos do model `Category` no `schema.prisma` (provavelmente `id`, `name`, `slug`, `image?`). Ajustar se diferente.

### B. `backend/src/controllers/adminCategoryController.ts`

```ts
import { Router, Request, Response } from 'express'
import { adminCategoryService } from '@/services/adminCategoryService'

const router = Router()

router.get('/', async (_req, res) => {
  res.json(await adminCategoryService.getAll())
})

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await adminCategoryService.create(req.body)) }
  catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try { res.json(await adminCategoryService.update(parseInt(req.params.id), req.body)) }
  catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try { await adminCategoryService.delete(parseInt(req.params.id)); res.status(204).send() }
  catch (err) { next(err) }
})

export const adminCategoryController = router
```

### C. `backend/src/server.ts`
Adicionar import:
```ts
import { adminCategoryController } from './controllers/adminCategoryController'
```
E registrar com middleware (já depois do Plano 01):
```ts
app.use('/api/v1/admin/categories', authMiddleware, adminMiddleware, adminCategoryController)
```

---

## Verificação

1. Login admin → `/admin/categorias` → lista categorias.
2. Criar nova → aparece na lista e no select do `ProductForm`.
3. Editar → muda nome/slug.
4. Deletar categoria sem produtos → some.
5. Tentar deletar categoria com produtos → erro `409 "Categoria possui produtos"`.
6. `curl`:
   ```bash
   curl -b cookies.txt -X POST http://localhost:4000/api/v1/admin/categories \
     -H "Content-Type: application/json" -d '{"name":"Tropical"}'
   ```
   Esperado: `201`.
