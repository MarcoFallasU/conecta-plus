import 'dotenv/config'
import fs from 'node:fs'
import { createClient } from '@libsql/client'

const file = process.argv[2]
if (!file) {
  console.error('Uso: node apply-migration.mjs migrations/archivo.sql')
  process.exit(1)
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const sql = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
await db.executeMultiple(sql)
console.log(`Migración aplicada: ${file}`)