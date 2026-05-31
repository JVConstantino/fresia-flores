# Design: Sessão 1 — Setup Inicial do Monorepo Frésia

**Data:** 2026-04-23
**Status:** Aprovado

---

## Objetivo

Sair do zero até ter o monorepo rodando localmente com frontend React+Vite+shadcn, backend Node+Express+Prisma, e MySQL via Docker — tudo verificável com `npm run dev` nos dois lados e `prisma migrate dev` sem erros.

---

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Package manager | npm | Padrão disponível |
| Docker scope | Só MySQL | Frontend+backend rodam com `npm run dev` direto |
| Monorepo | Pasta única `fresia/` com `frontend/` e `backend/` | Simples, um repositório |
| Produção | Banco separado no servidor compartilhado | Docker não será usado em prod para app |

---

## Estrutura de Arquivos

```
fresia/                              # raiz (já existe com CLAUDE.md e docs/)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/                  # shadcn primitivos (gerados pelo CLI)
│   │   ├── lib/
│   │   │   └── utils.ts             # cn() helper do shadcn
│   │   ├── App.tsx                  # rota raiz temporária
│   │   └── main.tsx
│   ├── index.html                   # importa Fraunces + DM Sans do Google Fonts
│   ├── vite.config.ts               # proxy /api → localhost:3001
│   ├── tailwind.config.ts           # tokens Frésia mapeados
│   ├── postcss.config.js
│   ├── components.json              # config shadcn
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/                  # vazio por ora
│   │   ├── middlewares/
│   │   │   └── errorHandler.ts      # middleware de erro centralizado
│   │   └── server.ts                # entry point Express 5
│   ├── prisma/
│   │   └── schema.prisma            # todas as entidades do MVP
│   ├── .env                         # DATABASE_URL, JWT_SECRET, PORT
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml               # MySQL 8.0 na porta 3306
└── CLAUDE.md
```

---

## Configurações Detalhadas

### `docker-compose.yml` — MySQL only

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

### `vite.config.ts` — proxy para backend

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

### `tailwind.config.ts` — tokens Frésia

```ts
theme.extend.colors: {
  lilac: { 50: '#f5f0fb', 100: '#ece3f7', 500: '#9b83e6', 600: '#8970d9' },
  petal: { 100: '#fde9e3', 400: '#f5a98c' },
  leaf:  { 500: '#5a9e68' },
  ink:   { 50: '#f9f8fc', 200: '#e8e4ef', 500: '#6b6579', 800: '#1f1c26' },
}
theme.extend.borderRadius: { md: '10px', lg: '16px', pill: '9999px' }
```

### `components.json` — shadcn mapeado

```json
{
  "style": "default",
  "tailwind": { "config": "tailwind.config.ts", "baseColor": "slate" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils" }
}
```

### `backend/.env`

```
DATABASE_URL="mysql://root:${MYSQL_ROOT_PASSWORD}@localhost:3306/fresia"
JWT_SECRET=
PORT=3001
```

### `server.ts` — Express 5

```ts
// express(), JSON middleware, CORS (localhost:5173 em dev)
// GET /api/v1/health → { status: 'ok', ts: Date.now() }
// errorHandler no final
```

### `schema.prisma` — entidades completas

Entidades: `User`, `Product`, `ProductVariant`, `Category`, `Order`, `OrderItem`, `Neighborhood`, `Setting`

Conforme especificado no CLAUDE.md — sem alterações.

---

## Critérios de Sucesso

| Verificação | Comando | Esperado |
|------------|---------|---------|
| MySQL sobe | `docker compose up -d` | container rodando |
| Schema aplicado | `npx prisma migrate dev --name init` | migration criada sem erros |
| Backend responde | `curl localhost:3001/api/v1/health` | `{ status: 'ok' }` |
| Frontend abre | `npm run dev` no frontend | localhost:5173 sem erros de console |
| Proxy funciona | fetch `/api/v1/health` no browser | resposta do backend |

---

## Fora do Escopo desta Sessão

- Componentes shadcn (Button, Card, Input, Badge) — Sessão 2
- Layout Header/Footer — Sessão 2
- Rotas de API reais — Sessão 3+
- Auth — Sessão 6
