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
  await conn.end()
  return true
}
