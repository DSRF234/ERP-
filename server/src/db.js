import mysql from 'mysql2/promise'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'erp_xingye',
  charset: 'utf8mb4',
  decimalNumbers: true,
  multipleStatements: true
}

let pool

export function getPool() {
  if (!pool) pool = mysql.createPool({ ...DB_CONFIG, waitForConnections: true, connectionLimit: 8 })
  return pool
}

/** 建库建表：读取 sql/schema.sql 执行 */
export async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8')
  const conn = await mysql.createConnection({
    host: DB_CONFIG.host, port: DB_CONFIG.port,
    user: DB_CONFIG.user, password: DB_CONFIG.password,
    multipleStatements: true, charset: 'utf8mb4'
  })
  await conn.query(sql)
  await ensureColumns(conn)
  await conn.end()
  return true
}

/**
 * 增量字段迁移：老库升级时自动补列，避免队友拉代码后手动执行 SQL。
 * 只做「加列」这一种安全变更。
 */
async function ensureColumns(conn) {
  const want = [
    { table: 'order_goods', column: 'price', ddl: "ALTER TABLE order_goods ADD COLUMN price DECIMAL(12,2) DEFAULT 0 COMMENT '成交单价' AFTER sku" },
    { table: 'stock_items', column: 'cost_price', ddl: "ALTER TABLE stock_items ADD COLUMN cost_price DECIMAL(12,2) DEFAULT 0 COMMENT '成本单价' AFTER left_qty" },
    { table: 'aftersales', column: 'proofs', ddl: "ALTER TABLE aftersales ADD COLUMN proofs LONGTEXT DEFAULT NULL COMMENT '客户凭证 JSON' AFTER message" },
    { table: 'aftersales', column: 'new_addr', ddl: "ALTER TABLE aftersales ADD COLUMN new_addr VARCHAR(255) DEFAULT '' COMMENT '改地址后新地址' AFTER proofs" }
  ]
  for (const w of want) {
    const [rows] = await conn.query(
      'SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ? LIMIT 1',
      [DB_CONFIG.database, w.table, w.column]
    )
    if (!rows.length) {
      await conn.query(`USE \`${DB_CONFIG.database}\``)
      await conn.query(w.ddl)
      console.log(`[db] 已补字段 ${w.table}.${w.column}`)
    }
  }
}
