import 'dotenv/config'
import fs from 'node:fs'
import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// PowerShell agrega un BOM al inicio del archivo; lo quitamos
const sql = fs.readFileSync('init.sql', 'utf8').replace(/^\uFEFF/, '')

await db.executeMultiple(sql)
console.log('Migración aplicada')