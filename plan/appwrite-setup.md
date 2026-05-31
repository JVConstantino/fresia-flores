# Setup Appwrite Self-Hosted — Frésia

## 1. Instalar Appwrite

```bash
cd fresia-claude-setup/fresia
docker compose -f docker-compose.appwrite.yml up -d
```

Acede a **http://localhost:6900** e cria a conta admin.

---

## 2. Criar Projeto

1. **Create Project** → Nome: `fresia` → ID: `fresia`

---

## 3. Gerar API Key

1. Vai a **Settings → API Keys → Add API Key**
2. **Nome:** `fresia-frontend`
3. **Scopes** (seleccionar todos):
   - `databases.read`
   - `databases.write`
   - `collections.read`
   - `collections.write`
   - `documents.read`
   - `documents.write`
   - `users.read`
   - `users.write`
   - `storage.read`
   - `storage.write`
   - `functions.read`
   - `functions.write`
4. Copia a key — vais precisar no `.env`

---

## 4. Criar Base de Dados

1. **Databases → Create Database**
2. Nome: `fresia` | ID: `fresia`

---

## 5. Criar Collections

Cria **pela ordem** (respeitar dependências):

### Lista de Collections

| # | ID | Notas |
|---|-----|-------|
| 1 | `categories` | name, slug, parentId |
| 2 | `products` | slug unique index |
| 3 | `product_variants` | productId index |
| 4 | `cities` | name, state |
| 5 | `neighborhoods` | cityId index |
| 6 | `coupons` | code unique index |
| 7 | `promotions` | — |
| 8 | `addresses` | userId index |
| 9 | `customers` | userId unique, segment index |
| 10 | `orders` | userId, status indexes |
| 11 | `order_items` | — |
| 12 | `inventory_movements` | productId+$createdAt index |
| 13 | `audit_logs` | userId+$createdAt, entity+entityId indexes |
| 14 | `notifications` | userId+read index |
| 15 | `banners` | isActive+order index |
| 16 | `top_bar` | — |
| 17 | `popups` | — |
| 18 | `webhooks` | — |
| 19 | `webhook_logs` | webhookId+$createdAt index |
| 20 | `newsletter` | — |
| 21 | `testimonials` | — |
| 22 | `settings` | key unique index |

### Atributos por Collection

#### `categories`
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string(255) | sim |
| slug | string(255) | sim |
| parentId | string(36) | não |

Index: `slug` — unique

#### `products`
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string(255) | sim |
| slug | string(255) | sim |
| description | string(5000) | não |
| price | double | sim |
| stock | integer | sim |
| images | string(2000) | sim |
| isActive | boolean | sim |
| categoryId | string(36) | sim |

Indexes: `slug` — unique; `categoryId`

#### `product_variants`
| Atributo | Tipo | Required |
|----------|------|----------|
| productId | string(36) | sim |
| name | string(255) | sim |
| price | double | sim |
| stock | integer | sim |

Index: `productId`

#### `cities`
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string(255) | sim |
| state | string(2) | sim |

#### `neighborhoods`
| Atributo | Tipo | Required |
|----------|------|----------|
| cityId | string(36) | sim |
| name | string(255) | sim |
| deliveryFee | double | sim |
| isActive | boolean | sim |

Index: `cityId`

#### `coupons`
| Atributo | Tipo | Required |
|----------|------|----------|
| code | string(50) | sim |
| discountType | string(20) | sim |
| discountValue | double | sim |
| minOrderValue | double | não |
| maxUses | integer | não |
| currentUses | integer | sim |
| isActive | boolean | sim |

Index: `code` — unique

#### `promotions`
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string(255) | sim |
| discountType | string(20) | sim |
| discountValue | double | sim |
| validFrom | datetime | sim |
| validTo | datetime | sim |
| isActive | boolean | sim |

#### `addresses`
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string(36) | sim |
| street | string(255) | sim |
| number | string(20) | sim |
| complement | string(255) | não |
| neighborhood | string(255) | sim |
| city | string(255) | sim |
| state | string(2) | sim |
| zip | string(10) | sim |
| isDefault | boolean | não |

Index: `userId`

#### `customers`
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string(36) | sim |
| name | string(255) | sim |
| email | string(255) | sim |
| ltv | double | sim |
| segment | string(20) | sim |
| notes | string(5000) | não |
| totalOrders | integer | sim |
| lastOrderAt | datetime | não |

Indexes: `userId` — unique; `segment`

#### `orders`
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string(36) | sim |
| status | string(20) | sim |
| paymentStatus | string(20) | sim |
| paymentMethod | string(20) | sim |
| total | double | sim |
| discount | double | sim |
| couponId | string(36) | não |
| deliveryMethod | string(20) | sim |
| deliveryFee | double | sim |
| deliveryMessage | string(500) | não |
| neighborhoodId | string(36) | não |
| customerName | string(255) | sim |
| customerEmail | string(255) | sim |
| customerPhone | string(20) | não |
| customerCpf | string(14) | não |
| items | string(5000) | sim |
| trackingCode | string(50) | não |

Indexes: `userId`; `status`

#### `inventory_movements`
| Atributo | Tipo | Required |
|----------|------|----------|
| productId | string(36) | sim |
| variantId | string(36) | não |
| type | string(20) | sim |
| qty | integer | sim |
| reason | string(500) | sim |
| orderId | string(36) | não |
| userId | string(36) | sim |

Indexes: `productId` + `$createdAt`

#### `audit_logs`
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string(36) | sim |
| action | string(20) | sim |
| entity | string(50) | sim |
| entityId | string(36) | sim |
| diff | string(5000) | não |
| ip | string(45) | não |

Indexes: `userId` + `$createdAt`; `entity` + `entityId`

#### `notifications`
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string(36) | sim |
| type | string(30) | sim |
| message | string(1000) | sim |
| read | boolean | sim |
| entityType | string(50) | não |
| entityId | string(36) | não |

Indexes: `userId` + `read`

#### `banners`
| Atributo | Tipo | Required |
|----------|------|----------|
| title | string(255) | sim |
| subtitle | string(255) | não |
| image | string(500) | sim |
| ctaText | string(100) | não |
| ctaLink | string(500) | não |
| isActive | boolean | sim |
| order | integer | sim |

Indexes: `isActive` + `order`

#### `top_bar`
| Atributo | Tipo | Required |
|----------|------|----------|
| text | string(255) | sim |
| activeFrom | datetime | não |
| activeTo | datetime | não |
| isActive | boolean | sim |

#### `popups`
| Atributo | Tipo | Required |
|----------|------|----------|
| title | string(255) | sim |
| body | string(1000) | não |
| ctaText | string(100) | não |
| ctaLink | string(500) | não |
| image | string(500) | não |
| event | string(20) | sim |
| delay | integer | não |
| frequency | string(30) | sim |
| isActive | boolean | sim |

#### `webhooks`
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string(255) | sim |
| url | string(500) | sim |
| events | string(1000) | sim |
| secret | string(255) | não |
| isActive | boolean | sim |
| maxRetries | integer | sim |

#### `webhook_logs`
| Atributo | Tipo | Required |
|----------|------|----------|
| webhookId | string(36) | sim |
| event | string(50) | sim |
| payload | string(5000) | sim |
| statusCode | integer | não |
| response | string(2000) | não |
| success | boolean | sim |
| attempt | integer | sim |

Indexes: `webhookId` + `$createdAt`

#### `newsletter`
| Atributo | Tipo | Required |
|----------|------|----------|
| email | string(255) | sim |

#### `testimonials`
| Atributo | Tipo | Required |
|----------|------|----------|
| clientName | string(255) | sim |
| rating | integer | sim |
| text | string(2000) | sim |
| isActive | boolean | sim |

#### `settings`
| Atributo | Tipo | Required |
|----------|------|----------|
| key | string(255) | sim |
| value | string(5000) | sim |

Index: `key` — unique

---

## 6. Configurar Permissões Default

Para cada collection, vai a **Settings → Permissions** e configura:

### Collections públicas de leitura (products, categories, cities, neighborhoods):
- **Any:** `read`

### Collections admin (restantes):
- **Any:** `read`, `create`, `update`, `delete`

> No MVP usa **Any** para tudo e restringe com roles mais tarde.

---

## 7. Variáveis de Ambiente

No `frontend/.env`, verifica:

```env
VITE_APPWRITE_ENDPOINT=http://localhost:6900/v1
VITE_APPWRITE_PROJECT=fresia
VITE_APPWRITE_DATABASE_ID=fresia
```

---

## 8. Testar Ligação

1. `npm run dev` (na pasta `frontend`)
2. Abre http://localhost:5173
3. DevTools → Console — sem erros vermelhos do Appwrite

---

## 9. Verificar Páginas Admin

- `/admin/clientes` — lista de clientes
- `/admin/estoque` — movimentações
- `/admin/auditoria` — logs
- `/admin/conteudo` — banners/popups
