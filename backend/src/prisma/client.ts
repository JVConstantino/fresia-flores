/**
 * Camada de compatibilidade Prisma → mysql2
 * Mantém a mesma API prisma.model.operation() sem binário nativo.
 */
import { query, queryOne, execute } from '@/lib/db'

type WhereClause = Record<string, any>

function buildWhere(where: WhereClause = {}): { sql: string; params: any[] } {
  const parts: string[] = []
  const params: any[] = []
  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND' || key === 'OR') {
      const subs = (val as WhereClause[]).map(w => buildWhere(w))
      const joined = subs.map(s => `(${s.sql})`).join(key === 'AND' ? ' AND ' : ' OR ')
      if (joined) parts.push(joined)
      subs.forEach(s => params.push(...s.params))
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if ('contains'   in val) { parts.push(`\`${key}\` LIKE ?`);    params.push(`%${val.contains}%`) }
      else if ('startsWith' in val) { parts.push(`\`${key}\` LIKE ?`); params.push(`${val.startsWith}%`) }
      else if ('endsWith'   in val) { parts.push(`\`${key}\` LIKE ?`); params.push(`%${val.endsWith}`) }
      else if ('gt'   in val) { parts.push(`\`${key}\` > ?`);  params.push(val.gt) }
      else if ('gte'  in val) { parts.push(`\`${key}\` >= ?`); params.push(val.gte) }
      else if ('lt'   in val) { parts.push(`\`${key}\` < ?`);  params.push(val.lt) }
      else if ('lte'  in val) { parts.push(`\`${key}\` <= ?`); params.push(val.lte) }
      else if ('in'   in val) { parts.push(`\`${key}\` IN (?)`); params.push(val.in) }
      else if ('not'  in val) { parts.push(`\`${key}\` != ?`); params.push(val.not) }
      else if ('equals' in val) { parts.push(`\`${key}\` = ?`); params.push(val.equals) }
    } else {
      if (val === null) parts.push(`\`${key}\` IS NULL`)
      else { parts.push(`\`${key}\` = ?`); params.push(val) }
    }
  }
  return { sql: parts.length ? parts.join(' AND ') : '1=1', params }
}

function buildOrderBy(orderBy: any): string {
  if (!orderBy) return ''
  const src = Array.isArray(orderBy) ? Object.assign({}, ...orderBy) : orderBy
  const entries = Object.entries(src)
  if (!entries.length) return ''
  return 'ORDER BY ' + entries.map(([k, v]) => `\`${k}\` ${String(v).toUpperCase()}`).join(', ')
}

function buildInsert(data: Record<string, any>) {
  const keys = Object.keys(data)
  return { cols: keys.map(k => `\`${k}\``).join(', '), placeholders: keys.map(() => '?').join(', '), params: Object.values(data) }
}

function buildSet(data: Record<string, any>) {
  const keys = Object.keys(data)
  return { setClause: keys.map(k => `\`${k}\` = ?`).join(', '), params: keys.map(k => data[k]) }
}

// Separa os campos escalares (vão para INSERT/UPDATE) das escritas aninhadas de
// relações (create/createMany/connect/etc). Descarta `undefined` (semântica Prisma:
// undefined = não informado → omitir; null = SQL NULL).
function splitWrite(table: string, data: Record<string, any>) {
  const rels = RELATIONS[table] || {}
  const scalars: Record<string, any> = {}
  const nested: Array<[string, any]> = []
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined) continue
    if (rels[k] && v !== null && typeof v === 'object') { nested.push([k, v]); continue }
    scalars[k] = v
  }
  return { scalars, nested }
}

// Aplica escritas aninhadas (apenas o necessário: create/createMany em toMany).
async function applyNestedWrites(table: string, parentId: any, nested: Array<[string, any]>) {
  const rels = RELATIONS[table] || {}
  for (const [key, ops] of nested) {
    const rel = rels[key]
    if (!rel || rel.kind !== 'toMany') continue
    const lists: any[] = []
    if (ops.createMany?.data) lists.push(...ops.createMany.data)
    if (ops.create) lists.push(...(Array.isArray(ops.create) ? ops.create : [ops.create]))
    for (const child of lists) {
      const childData: Record<string, any> = { [rel.fk]: parentId }
      for (const [ck, cv] of Object.entries(child)) if (cv !== undefined) childData[ck] = cv
      const { cols, placeholders, params } = buildInsert(childData)
      await execute(`INSERT INTO \`${rel.target}\` (${cols}) VALUES (${placeholders})`, params)
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Resolução de relações (include / select / _count) — emula o Prisma.
 * ────────────────────────────────────────────────────────────────────────── */

type Rel =
  | { kind: 'toOne';  target: string; fk: string }   // fk na linha atual → target.id
  | { kind: 'toMany'; target: string; fk: string }   // fk no alvo → linha atual.id
  | { kind: 'm2m';    target: string; join: string; selfCol: 'A' | 'B'; otherCol: 'A' | 'B' }

const RELATIONS: Record<string, Record<string, Rel>> = {
  User: {
    addresses:    { kind: 'toMany', target: 'Address',     fk: 'userId' },
    orders:       { kind: 'toMany', target: 'Order',       fk: 'userId' },
    paymentCards: { kind: 'toMany', target: 'PaymentCard', fk: 'userId' },
    wishlist:     { kind: 'toMany', target: 'Wishlist',    fk: 'userId' },
  },
  Address:     { user: { kind: 'toOne', target: 'User', fk: 'userId' } },
  PaymentCard: { user: { kind: 'toOne', target: 'User', fk: 'userId' } },
  City:        { neighborhoods: { kind: 'toMany', target: 'Neighborhood', fk: 'cityId' } },
  Neighborhood: {
    city:   { kind: 'toOne',  target: 'City',  fk: 'cityId' },
    orders: { kind: 'toMany', target: 'Order', fk: 'neighborhoodId' },
  },
  Category:       { products: { kind: 'toMany', target: 'Product', fk: 'categoryId' } },
  SupplyCategory: { supplies: { kind: 'toMany', target: 'Supply',  fk: 'categoryId' } },
  Supply: {
    category:  { kind: 'toOne',  target: 'SupplyCategory', fk: 'categoryId' },
    movements: { kind: 'toMany', target: 'SupplyMovement', fk: 'supplyId' },
  },
  SupplyMovement: { supply: { kind: 'toOne', target: 'Supply', fk: 'supplyId' } },
  Product: {
    category:   { kind: 'toOne',  target: 'Category',       fk: 'categoryId' },
    variants:   { kind: 'toMany', target: 'ProductVariant', fk: 'productId' },
    orderItems: { kind: 'toMany', target: 'OrderItem',      fk: 'productId' },
    wishlist:   { kind: 'toMany', target: 'Wishlist',       fk: 'productId' },
    promotions: { kind: 'm2m', target: 'Promotion', join: '_ProductToPromotion', selfCol: 'A', otherCol: 'B' },
  },
  ProductVariant: {
    product:    { kind: 'toOne',  target: 'Product',   fk: 'productId' },
    orderItems: { kind: 'toMany', target: 'OrderItem', fk: 'variantId' },
  },
  Order: {
    user:         { kind: 'toOne',  target: 'User',         fk: 'userId' },
    coupon:       { kind: 'toOne',  target: 'Coupon',       fk: 'couponId' },
    neighborhood: { kind: 'toOne',  target: 'Neighborhood', fk: 'neighborhoodId' },
    items:        { kind: 'toMany', target: 'OrderItem',    fk: 'orderId' },
  },
  OrderItem: {
    order:   { kind: 'toOne', target: 'Order',          fk: 'orderId' },
    product: { kind: 'toOne', target: 'Product',        fk: 'productId' },
    variant: { kind: 'toOne', target: 'ProductVariant', fk: 'variantId' },
  },
  Promotion: {
    products: { kind: 'm2m', target: 'Product', join: '_ProductToPromotion', selfCol: 'B', otherCol: 'A' },
  },
  Webhook:    { logs:    { kind: 'toMany', target: 'WebhookLog', fk: 'webhookId' } },
  WebhookLog: { webhook: { kind: 'toOne',  target: 'Webhook',    fk: 'webhookId' } },
}

const uniq = <T>(arr: T[]): T[] => [...new Set(arr.filter(v => v !== null && v !== undefined))]
const ph   = (n: number): string => Array(n).fill('?').join(',')

// Conta relações toMany/m2m para a cláusula _count
async function countRelation(rel: Rel, parentIds: any[], where: any): Promise<Map<any, number>> {
  const map = new Map<any, number>()
  if (!parentIds.length) return map
  if (rel.kind === 'toMany') {
    const w = buildWhere(where || {})
    const rows = await query(
      `SELECT \`${rel.fk}\` AS _pid, COUNT(*) AS _c FROM \`${rel.target}\`
       WHERE \`${rel.fk}\` IN (${ph(parentIds.length)})${where ? ` AND ${w.sql}` : ''}
       GROUP BY \`${rel.fk}\``,
      [...parentIds, ...(where ? w.params : [])]
    )
    for (const r of rows as any[]) map.set(r._pid, Number(r._c))
  } else if (rel.kind === 'm2m') {
    const rows = await query(
      `SELECT \`${rel.selfCol}\` AS _pid, COUNT(*) AS _c FROM \`${rel.join}\`
       WHERE \`${rel.selfCol}\` IN (${ph(parentIds.length)}) GROUP BY \`${rel.selfCol}\``,
      parentIds
    )
    for (const r of rows as any[]) map.set(r._pid, Number(r._c))
  }
  return map
}

// Hidrata `rows` com as relações pedidas em include/select e projeta colunas de select.
async function hydrate(table: string, rows: any[], args: { include?: any; select?: any } = {}): Promise<any[]> {
  if (!rows || !rows.length) return rows
  const rels = RELATIONS[table] || {}
  const directives: Record<string, any> = { ...(args.include || {}) }
  // chaves de relação dentro de select também são resolvidas
  if (args.select) for (const [k, v] of Object.entries(args.select)) {
    if ((rels[k] || k === '_count') && v) directives[k] = v === true ? true : v
  }

  for (const [key, sub] of Object.entries(directives)) {
    if (!sub) continue

    if (key === '_count') {
      const countSel = (sub as any).select || sub
      for (const [relName, cfg] of Object.entries(countSel as Record<string, any>)) {
        const rel = rels[relName]
        if (!rel) continue
        const where = cfg && typeof cfg === 'object' && cfg.where ? cfg.where : undefined
        const map = await countRelation(rel, uniq(rows.map(r => r.id)), where)
        for (const r of rows) { r._count = r._count || {}; r._count[relName] = map.get(r.id) ?? 0 }
      }
      continue
    }

    const rel = rels[key]
    if (!rel) continue
    const nested = (sub && typeof sub === 'object') ? { include: sub.include, select: sub.select } : {}

    // hydrate() preserva a ordem das linhas → casamos `found[i]` (cru, com id)
    // com `hydrated[i]` (possivelmente projetado pelo select aninhado).
    if (rel.kind === 'toOne') {
      const ids = uniq(rows.map(r => r[rel.fk]))
      const map = new Map<any, any>()
      if (ids.length) {
        const found = await query(`SELECT * FROM \`${rel.target}\` WHERE \`id\` IN (${ph(ids.length)})`, ids) as any[]
        const hydrated = await hydrate(rel.target, found, nested)
        found.forEach((f, i) => map.set(f.id, hydrated[i]))
      }
      for (const r of rows) r[key] = map.get(r[rel.fk]) ?? null

    } else if (rel.kind === 'toMany') {
      const ids = uniq(rows.map(r => r.id))
      const grouped = new Map<any, any[]>()
      if (ids.length) {
        const extra = (sub && typeof sub === 'object' && sub.where) ? buildWhere(sub.where) : null
        const order = (sub && typeof sub === 'object') ? buildOrderBy(sub.orderBy) : ''
        const found = await query(
          `SELECT * FROM \`${rel.target}\` WHERE \`${rel.fk}\` IN (${ph(ids.length)})${extra ? ` AND ${extra.sql}` : ''} ${order}`,
          [...ids, ...(extra ? extra.params : [])]
        ) as any[]
        const hydrated = await hydrate(rel.target, found, nested)
        found.forEach((f, i) => {
          const arr = grouped.get(f[rel.fk]) || []
          arr.push(hydrated[i]); grouped.set(f[rel.fk], arr)
        })
      }
      const take = (sub && typeof sub === 'object' && typeof sub.take === 'number') ? sub.take : undefined
      for (const r of rows) {
        let arr = grouped.get(r.id) || []
        if (take !== undefined) arr = arr.slice(0, take)
        r[key] = arr
      }

    } else if (rel.kind === 'm2m') {
      const ids = uniq(rows.map(r => r.id))
      const grouped = new Map<any, any[]>()
      if (ids.length) {
        const links = await query(
          `SELECT \`${rel.selfCol}\` AS _self, \`${rel.otherCol}\` AS _other FROM \`${rel.join}\` WHERE \`${rel.selfCol}\` IN (${ph(ids.length)})`,
          ids
        ) as any[]
        const otherIds = uniq(links.map(l => l._other))
        const targets = new Map<any, any>()
        if (otherIds.length) {
          const found = await query(`SELECT * FROM \`${rel.target}\` WHERE \`id\` IN (${ph(otherIds.length)})`, otherIds) as any[]
          const hydrated = await hydrate(rel.target, found, nested)
          found.forEach((f, i) => targets.set(f.id, hydrated[i]))
        }
        for (const l of links) {
          const t = targets.get(l._other); if (t === undefined) continue
          const arr = grouped.get(l._self) || []; arr.push(t); grouped.set(l._self, arr)
        }
      }
      for (const r of rows) r[key] = grouped.get(r.id) || []
    }
  }

  // Projeção: se select no topo, devolve só as chaves pedidas
  if (args.select) {
    const keys = Object.keys(args.select).filter(k => args.select[k])
    return rows.map(r => {
      const out: any = {}
      for (const k of keys) out[k] = r[k]
      return out
    })
  }
  return rows
}

function model(table: string) {
  return {
    async findUnique(args: { where: WhereClause; select?: any; include?: any }) {
      const { sql, params } = buildWhere(args.where)
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} LIMIT 1`, params)
      if (!row) return null
      return (await hydrate(table, [row], args))[0]
    },
    async findFirst(args: { where?: WhereClause; orderBy?: any; include?: any; select?: any } = {}) {
      const { sql, params } = buildWhere(args.where)
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} ${buildOrderBy(args.orderBy)} LIMIT 1`, params)
      if (!row) return null
      return (await hydrate(table, [row], args))[0]
    },
    async findMany(args: { where?: WhereClause; orderBy?: any; take?: number; skip?: number; select?: any; include?: any } = {}) {
      const { sql, params } = buildWhere(args.where)
      const limit  = args.take != null ? `LIMIT ${args.take}` : ''
      const offset = args.skip != null ? `OFFSET ${args.skip}` : ''
      const rows = await query(`SELECT * FROM \`${table}\` WHERE ${sql} ${buildOrderBy(args.orderBy)} ${limit} ${offset}`, params)
      return hydrate(table, rows as any[], args)
    },
    async create(args: { data: Record<string, any>; select?: any; include?: any }) {
      const { scalars, nested } = splitWrite(table, args.data)
      const { cols, placeholders, params } = buildInsert(scalars)
      const res = await execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, params)
      await applyNestedWrites(table, res.insertId, nested)
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE id = ?`, [res.insertId])
      if (!row) return null
      return (await hydrate(table, [row], args))[0]
    },
    async update(args: { where: WhereClause; data: Record<string, any>; select?: any; include?: any }) {
      const { scalars, nested } = splitWrite(table, args.data)
      const { sql, params: wp } = buildWhere(args.where)
      if (Object.keys(scalars).length) {
        const { setClause, params: sp } = buildSet(scalars)
        await execute(`UPDATE \`${table}\` SET ${setClause} WHERE ${sql}`, [...sp, ...wp])
      }
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql}`, wp)
      if (row && nested.length) await applyNestedWrites(table, (row as any).id, nested)
      if (!row) return null
      return (await hydrate(table, [row], args))[0]
    },
    async upsert(args: { where: WhereClause; create: Record<string, any>; update: Record<string, any>; select?: any; include?: any }) {
      const { sql, params } = buildWhere(args.where)
      const existing = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} LIMIT 1`, params)
      return existing
        ? this.update({ where: args.where, data: args.update, select: args.select, include: args.include })
        : this.create({ data: args.create, select: args.select, include: args.include })
    },
    async delete(args: { where: WhereClause; select?: any; include?: any }) {
      const { sql, params } = buildWhere(args.where)
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} LIMIT 1`, params)
      await execute(`DELETE FROM \`${table}\` WHERE ${sql}`, params)
      if (!row) return null
      return (await hydrate(table, [row], args))[0]
    },
    async deleteMany(args: { where?: WhereClause } = {}) {
      const { sql, params } = buildWhere(args.where)
      const res = await execute(`DELETE FROM \`${table}\` WHERE ${sql}`, params)
      return { count: res.affectedRows }
    },
    async updateMany(args: { where?: WhereClause; data: Record<string, any> }) {
      const { setClause, params: sp } = buildSet(args.data)
      const { sql, params: wp }       = buildWhere(args.where)
      const res = await execute(`UPDATE \`${table}\` SET ${setClause} WHERE ${sql}`, [...sp, ...wp])
      return { count: res.affectedRows }
    },
    async count(args: { where?: WhereClause } = {}) {
      const { sql, params } = buildWhere(args.where)
      const row = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM \`${table}\` WHERE ${sql}`, params)
      return Number(row?.total ?? 0)
    },
    async createMany(args: { data: Record<string, any>[]; skipDuplicates?: boolean }) {
      let count = 0
      for (const item of args.data) {
        try { await this.create({ data: item }); count++ }
        catch (e: any) { if (!args.skipDuplicates || e.code !== 'ER_DUP_ENTRY') throw e }
      }
      return { count }
    },
    async groupBy(args: { by: string[]; where?: WhereClause; _count?: any; _sum?: any; _avg?: any; orderBy?: any; take?: number }) {
      const { sql, params } = buildWhere(args.where)
      const groupCols = args.by.map(c => `\`${c}\``).join(', ')
      const selectExtras: string[] = []
      if (args._count) {
        if (args._count._all) selectExtras.push('COUNT(*) as `_count__all`')
        for (const [k] of Object.entries(args._count)) { if (k !== '_all') selectExtras.push(`COUNT(\`${k}\`) as \`_count_${k}\``) }
      }
      if (args._sum) { for (const [k] of Object.entries(args._sum)) selectExtras.push(`SUM(\`${k}\`) as \`_sum_${k}\``) }
      if (args._avg) { for (const [k] of Object.entries(args._avg)) selectExtras.push(`AVG(\`${k}\`) as \`_avg_${k}\``) }
      const selectAll = [groupCols, ...selectExtras].join(', ')
      const limit = args.take != null ? `LIMIT ${args.take}` : ''
      const rows = await query(`SELECT ${selectAll} FROM \`${table}\` WHERE ${sql} GROUP BY ${groupCols} ${buildOrderBy(args.orderBy)} ${limit}`, params)
      // remap to Prisma-like shape: { userId: 1, _count: { _all: 3 }, _sum: { qty: 5 } }
      return rows.map((row: any) => {
        const out: any = {}
        for (const col of args.by) out[col] = row[col]
        if (args._count) {
          out._count = {}
          if (args._count._all) out._count._all = Number(row[`_count__all`] ?? 0)
          for (const [k] of Object.entries(args._count)) { if (k !== '_all') out._count[k] = Number(row[`_count_${k}`] ?? 0) }
        }
        if (args._sum) { out._sum = {}; for (const [k] of Object.entries(args._sum)) out._sum[k] = Number(row[`_sum_${k}`] ?? 0) }
        if (args._avg) { out._avg = {}; for (const [k] of Object.entries(args._avg)) out._avg[k] = Number(row[`_avg_${k}`] ?? 0) }
        return out
      })
    },
  }
}

export const prisma = {
  user:                   model('User'),
  product:                model('Product'),
  productVariant:         model('ProductVariant'),
  category:               model('Category'),
  order:                  model('Order'),
  orderItem:              model('OrderItem'),
  neighborhood:           model('Neighborhood'),
  city:                   model('City'),
  setting:                model('Setting'),
  promotion:              model('Promotion'),
  coupon:                 model('Coupon'),
  testimonial:            model('Testimonial'),
  newsletterSubscription: model('NewsletterSubscription'),
  webhook:                model('Webhook'),
  webhookLog:             model('WebhookLog'),
  wishlist:               model('Wishlist'),
  supply:                 model('Supply'),
  supplyCategory:         model('SupplyCategory'),
  supplyMovement:         model('SupplyMovement'),
  post:                   model('Post'),
  media:                  model('Media'),
  address:                model('Address'),
  paymentCard:            model('PaymentCard'),

  $queryRaw: async (strings: TemplateStringsArray, ...values: any[]) => {
    const sql = strings.reduce((acc, s, i) => acc + s + (values[i] != null ? '?' : ''), '')
    return query(sql, values.filter(v => v != null))
  },

  $transaction: async (fn: (tx: any) => Promise<any>) => fn(prisma),
}
