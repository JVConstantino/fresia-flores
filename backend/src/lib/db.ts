/**
 * db.ts — Camada de acesso ao banco usando mysql2 (puro JS, sem binário nativo)
 * Pool inicializado de forma lazy — só na primeira query, garantindo que
 * process.env.DATABASE_URL já foi carregado pelo dotenv.
 */
import mysql from 'mysql2/promise'

let _pool: mysql.Pool | null = null

function getPool(): mysql.Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL não configurado')

    const u = new URL(url.split('?')[0])
    const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')

    const baseConfig = {
      user:             u.username,
      password:         decodeURIComponent(u.password),
      database:         u.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit:  Number(params.get('connection_limit') || 5),
      connectTimeout:   10000,
    }

    // Conexão sempre via TCP (Hostinger Web Apps: MySQL local em 127.0.0.1:3306)
    const host = u.hostname === 'localhost' ? '127.0.0.1' : u.hostname
    const port = Number(u.port) || 3306
    console.log(`[db] conectando via TCP: ${host}:${port}`)
    _pool = mysql.createPool({ ...baseConfig, host, port })
  }
  return _pool
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().execute(sql, params)
  return result as mysql.ResultSetHeader
}
