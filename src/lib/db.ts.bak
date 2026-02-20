/**
 * Base de datos PostgreSQL.
 * Se conecta usando DATABASE_URL (Railway Postgres interno).
 * 
 * Sistema de packs de diseños:
 * - Gratis: 1 diseño/día con marca de agua, sin upscale
 * - Con créditos: sin marca de agua, con upscale incluido
 */

import { Pool } from 'pg'
import { FREE_DAILY_LIMIT } from './tiers'

// ── Tipos ───────────────────────────────────────────────

export interface UserRecord {
  email: string
  name: string
  image: string
  stripeCustomerId: string | null
  designCredits: number
  freeDownloadsToday: { count: number; resetAt: number }
  createdAt: number
  updatedAt: number
}

// ── Pool de conexión ────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

// ── Inicialización de tablas ────────────────────────────

let initialized = false

async function ensureTables(): Promise<void> {
  if (initialized) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      stripe_customer_id TEXT,
      design_credits INTEGER NOT NULL DEFAULT 0,
      free_downloads_count INTEGER NOT NULL DEFAULT 0,
      free_downloads_reset_at BIGINT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ip_rate_limit (
      ip TEXT PRIMARY KEY,
      last_download BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);
  `)
  initialized = true
}

// ── Helpers ─────────────────────────────────────────────

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    email: row.email as string,
    name: row.name as string,
    image: row.image as string,
    stripeCustomerId: (row.stripe_customer_id as string) || null,
    designCredits: row.design_credits as number,
    freeDownloadsToday: {
      count: row.free_downloads_count as number,
      resetAt: Number(row.free_downloads_reset_at),
    },
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}

// ── Operaciones de Usuario ──────────────────────────────

export async function getUser(email: string): Promise<UserRecord | null> {
  await ensureTables()
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  if (rows.length === 0) return null
  return rowToUser(rows[0])
}

export async function upsertUser(email: string, data: Partial<UserRecord>): Promise<UserRecord> {
  await ensureTables()
  const now = Date.now()
  const existing = await getUser(email)

  const name = data.name || existing?.name || ''
  const image = data.image || existing?.image || ''
  const stripeCustomerId = data.stripeCustomerId ?? existing?.stripeCustomerId ?? null
  const designCredits = data.designCredits ?? existing?.designCredits ?? 0
  const freeDownloads = data.freeDownloadsToday || existing?.freeDownloadsToday || {
    count: 0,
    resetAt: now + 86400000,
  }
  const createdAt = existing?.createdAt || now

  const { rows } = await pool.query(
    `INSERT INTO users (email, name, image, stripe_customer_id, design_credits, free_downloads_count, free_downloads_reset_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET
       name = $2, image = $3, stripe_customer_id = $4, design_credits = $5,
       free_downloads_count = $6, free_downloads_reset_at = $7, updated_at = $9
     RETURNING *`,
    [email, name, image, stripeCustomerId, designCredits, freeDownloads.count, freeDownloads.resetAt, createdAt, now]
  )

  return rowToUser(rows[0])
}

export async function addDesignCredits(email: string, credits: number): Promise<UserRecord | null> {
  const user = await getUser(email)
  if (!user) return null
  return upsertUser(email, {
    designCredits: user.designCredits + credits,
  })
}

/**
 * Intenta usar un crédito de diseño.
 */
export async function consumeDesignCredit(email: string): Promise<{ allowed: boolean; usedCredit: boolean; watermark: boolean; reason?: string }> {
  const user = await getUser(email)
  if (!user) return { allowed: false, usedCredit: false, watermark: true, reason: 'Usuario no encontrado.' }

  if (user.designCredits > 0) {
    await upsertUser(email, { designCredits: user.designCredits - 1 })
    return { allowed: true, usedCredit: true, watermark: false }
  }

  const now = Date.now()
  const freeDownloads = { ...user.freeDownloadsToday }

  if (now >= freeDownloads.resetAt) {
    freeDownloads.count = 0
    freeDownloads.resetAt = now + 86400000
  }

  if (freeDownloads.count >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      usedCredit: false,
      watermark: true,
      reason: 'Ya usaste tu diseño gratis de hoy. Compra un pack para seguir creando.',
    }
  }

  freeDownloads.count++
  await upsertUser(email, { freeDownloadsToday: freeDownloads })
  return { allowed: true, usedCredit: false, watermark: true }
}

/**
 * Verificar si el usuario puede descargar y cuáles son sus condiciones.
 */
export async function checkUserDownload(email: string): Promise<{ allowed: boolean; watermark: boolean; hasCredits: boolean; remainingCredits: number; message?: string }> {
  const user = await getUser(email)
  if (!user) return { allowed: false, watermark: true, hasCredits: false, remainingCredits: 0, message: 'Usuario no encontrado.' }

  if (user.designCredits > 0) {
    return { allowed: true, watermark: false, hasCredits: true, remainingCredits: user.designCredits }
  }

  const now = Date.now()
  const freeDownloads = { ...user.freeDownloadsToday }
  if (now >= freeDownloads.resetAt) freeDownloads.count = 0

  if (freeDownloads.count >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      watermark: true,
      hasCredits: false,
      remainingCredits: 0,
      message: 'Ya usaste tu diseño gratis de hoy. Compra un pack para seguir creando.',
    }
  }

  return { allowed: true, watermark: true, hasCredits: false, remainingCredits: 0 }
}

/**
 * Verificar si el usuario puede usar upscale (solo con créditos).
 */
export async function checkUpscaleAccess(email: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getUser(email)
  if (!user) return { allowed: false, reason: 'Usuario no encontrado.' }

  if (user.designCredits > 0) {
    return { allowed: true }
  }

  return { allowed: false, reason: 'Necesitas créditos de diseño para mejorar imágenes. Compra un pack.' }
}

// ── Rate Limit por IP (anónimos) ────────────────────────

export async function checkIpRateLimit(ip: string): Promise<{ allowed: boolean; remainingHours?: number; message?: string }> {
  await ensureTables()
  const now = Date.now()
  const ONE_DAY = 86400000

  // Limpiar entradas viejas
  await pool.query('DELETE FROM ip_rate_limit WHERE last_download < $1', [now - ONE_DAY])

  const { rows } = await pool.query('SELECT last_download FROM ip_rate_limit WHERE ip = $1', [ip])

  if (rows.length > 0) {
    const lastDownload = Number(rows[0].last_download)
    if (now - lastDownload < ONE_DAY) {
      const remainingMs = ONE_DAY - (now - lastDownload)
      const remainingHours = Math.ceil(remainingMs / 3600000)
      return {
        allowed: false,
        remainingHours,
        message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s). Crea una cuenta o compra un pack para más.`,
      }
    }
  }

  return { allowed: true }
}

export async function recordIpDownload(ip: string): Promise<void> {
  await ensureTables()
  await pool.query(
    `INSERT INTO ip_rate_limit (ip, last_download) VALUES ($1, $2)
     ON CONFLICT (ip) DO UPDATE SET last_download = $2`,
    [ip, Date.now()]
  )
}

// ── Búsqueda por Stripe Customer ID ────────────────────

export async function getUserByStripeCustomerId(customerId: string): Promise<UserRecord | null> {
  await ensureTables()
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE stripe_customer_id = $1',
    [customerId]
  )
  if (rows.length === 0) return null
  return rowToUser(rows[0])
}
