# Appwrite Collections Schema — Frésia

## users (Appwrite Auth built-in)
- Atributos/labels: `admin` (label set via Appwrite Console para users admin)

## products
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string (255) | sim |
| slug | string (255) | sim |
| description | string (5000) | não |
| price | double | sim |
| stock | integer | sim |
| images | string (JSON array) | sim |
| isActive | boolean | sim |
| categoryId | string | sim |
| createdAt | datetime | auto |

Indexes: slug (unique), categoryId, isActive+stock

## product_variants
| Atributo | Tipo | Required |
|----------|------|----------|
| productId | string | sim |
| name | string (255) | sim |
| price | double | sim |
| stock | integer | sim |

Index: productId

## categories
| Atributo | Tipo | Required |
|----------|------|----------|
| name | string (255) | sim |
| slug | string (255) | sim |
| parentId | string | não |

Indexes: slug (unique), parentId

## orders
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string | sim |
| status | string (enum) | sim |
| paymentStatus | string (enum) | sim |
| paymentMethod | string | sim |
| total | double | sim |
| discount | double | sim |
| couponId | string | não |
| deliveryMethod | string | sim |
| deliveryFee | double | sim |
| deliveryMessage | string (500) | não |
| neighborhoodId | string | não |
| customerName | string | sim |
| customerEmail | string | sim |
| customerPhone | string | não |
| customerCpf | string | não |
| items | string (JSON) | sim |
| trackingCode | string | não |
| createdAt | datetime | auto |
| updatedAt | datetime | auto |

Indexes: userId, status, createdAt

## inventory_movements
| Atributo | Tipo | Required |
|----------|------|----------|
| productId | string | sim |
| variantId | string | não |
| type | string (enum: in/out/reserve/release) | sim |
| qty | integer | sim |
| reason | string (500) | sim |
| orderId | string | não |
| userId | string | sim |
| createdAt | datetime | auto |

Indexes: productId+createdAt, type+createdAt

## addresses
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string | sim |
| street | string (255) | sim |
| number | string (20) | sim |
| complement | string (255) | não |
| neighborhood | string (255) | sim |
| city | string (255) | sim |
| state | string (2) | sim |
| zip | string (10) | sim |
| isDefault | boolean | não |

Index: userId

## customers
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string | sim |
| ltv | double | não |
| segment | string (enum: vip/regular/inactive) | não |
| notes | string (JSON array) | não |
| totalOrders | integer | não |
| lastOrderAt | datetime | não |

Index: userId (unique), segment

## audit_logs
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string | sim |
| action | string (enum) | sim |
| entity | string | sim |
| entityId | string | sim |
| diff | string (JSON) | não |
| ip | string | não |
| createdAt | datetime | auto |

Indexes: userId+createdAt, entity+entityId, action+createdAt

## notifications
| Atributo | Tipo | Required |
|----------|------|----------|
| userId | string | sim |
| type | string (enum: order/new_payment/low_stock/review) | sim |
| message | string (1000) | sim |
| read | boolean | sim |
| entityType | string | não |
| entityId | string | não |
| createdAt | datetime | auto |

Indexes: userId+read+createdAt, type+createdAt

## banners
| Atributo | Tipo | Required |
|----------|------|----------|
| title | string (255) | sim |
| subtitle | string (255) | não |
| image | string (URL) | sim |
| ctaText | string (100) | não |
| ctaLink | string (500) | não |
| isActive | boolean | sim |
| order | integer | sim |

Index: isActive+order

## top_bar
| Atributo | Tipo | Required |
|----------|------|----------|
| text | string (255) | sim |
| activeFrom | datetime | não |
| activeTo | datetime | não |
| isActive | boolean | sim |

## popups
| Atributo | Tipo | Required |
|----------|------|----------|
| title | string (255) | sim |
| body | string (1000) | não |
| ctaText | string (100) | não |
| ctaLink | string (500) | não |
| image | string (URL) | não |
| event | string (enum: exit_intent/timer/page) | sim |
| delay | integer | não |
| frequency | string (enum: always/once_per_session/once_per_user) | sim |
| isActive | boolean | sim |

## news subscriptions, testimonials, coupons, promotions, cities, neighborhoods, webhooks, webhook_logs, settings
Mantidos da mesma forma que no schema Prisma actual.
