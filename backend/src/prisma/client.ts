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
  return { setClause: keys.map(k => `\`${k}\` = ?`).join(', '), params: Object.values(data) }
}

function model(table: string) {
  return {
    async findUnique(args: { where: WhereClause; select?: any; include?: any }) {
      const { sql, params } = buildWhere(args.where)
      return queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} LIMIT 1`, params)
    },
    async findFirst(args: { where?: WhereClause; orderBy?: any; include?: any; select?: any }) {
      const { sql, params } = buildWhere(args.where)
      return queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} ${buildOrderBy(args.orderBy)} LIMIT 1`, params)
    },
    async findMany(args: { where?: WhereClause; orderBy?: any; take?: number; skip?: number; select?: any; include?: any } = {}) {
      const { sql, params } = buildWhere(args.where)
      const limit  = args.take != null ? `LIMIT ${args.take}` : ''
      const offset = args.skip != null ? `OFFSET ${args.skip}` : ''
      return query(`SELECT * FROM \`${table}\` WHERE ${sql} ${buildOrderBy(args.orderBy)} ${limit} ${offset}`, params)
    },
    async create(args: { data: Record<string, any>; select?: any; include?: any }) {
      const { cols, placeholders, params } = buildInsert(args.data)
      const res = await execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, params)
      return queryOne(`SELECT * FROM \`${table}\` WHERE id = ?`, [res.insertId])
    },
    async update(args: { where: WhereClause; data: Record<string, any>; select?: any; include?: any }) {
      const { setClause, params: sp } = buildSet(args.data)
      const { sql, params: wp }       = buildWhere(args.where)
      await execute(`UPDATE \`${table}\` SET ${setClause} WHERE ${sql}`, [...sp, ...wp])
      return queryOne(`SELECT * FROM \`${table}\` WHERE ${sql}`, wp)
    },
    async upsert(args: { where: WhereClause; create: Record<string, any>; update: Record<string, any>; include?: any }) {
      const { sql, params } = buildWhere(args.where)
      const existing = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} LIMIT 1`, params)
      return existing ? this.update({ where: args.where, data: args.update }) : this.create({ data: args.create })
    },
    async delete(args: { where: WhereClause; include?: any }) {
      const { sql, params } = buildWhere(args.where)
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE ${sql} LIMIT 1`, params)
      await execute(`DELETE FROM \`${table}\` WHERE ${sql}`, params)
      return row
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
