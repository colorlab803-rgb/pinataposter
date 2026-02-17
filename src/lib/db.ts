/**
 * Base de datos en archivo JSON persistente.
 * Usa /data en Railway (volumen) o .app-data/ en dev local.
 * 
 * Sistema de packs de diseños:
 * - Gratis: 1 diseño/día con marca de agua, sin upscale
 * - Con créditos: sin marca de agua, con upscale incluido
 */

import fs from 'fs'
import path from 'path'
import { FREE_DAILY_LIMIT } from './tiers'

// ── Tipos ───────────────────────────────────────────────

export interface UserRecord {
  email: string
  name: string
  image: string
  stripeCustomerId: string | null
  designCredits: number               // créditos de packs comprados
  freeDownloadsToday: { count: number; resetAt: number }  // descargas gratis del día
  createdAt: number
  updatedAt: number
}

export interface DbSchema {
  users: Record<string, UserRecord>       // key = email
  ipRateLimit: Record<string, number>     // key = ip, value = timestamp
}

// ── Helpers de directorio ───────────────────────────────

function getDataDir(): string {
  const railwayVolume = '/data'
  if (process.platform !== 'win32' && fs.existsSync(railwayVolume)) {
    return railwayVolume
  }
  const localDir = path.join(process.cwd(), '.app-data')
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true })
  }
  return localDir
}

function getDbPath(): string {
  return path.join(getDataDir(), 'db.json')
}

// ── Lectura / Escritura ─────────────────────────────────

function readDb(): DbSchema {
  try {
    const filePath = getDbPath()
    if (!fs.existsSync(filePath)) {
      return { users: {}, ipRateLimit: {} }
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as DbSchema
  } catch {
    return { users: {}, ipRateLimit: {} }
  }
}

function writeDb(db: DbSchema): void {
  try {
    const filePath = getDbPath()
    const tmpPath = filePath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8')
    fs.renameSync(tmpPath, filePath)
  } catch (err) {
    console.error('Error al escribir DB:', err)
  }
}

// ── Operaciones de Usuario ──────────────────────────────

export function getUser(email: string): UserRecord | null {
  const db = readDb()
  return db.users[email] || null
}

export function upsertUser(email: string, data: Partial<UserRecord>): UserRecord {
  const db = readDb()
  const now = Date.now()
  const existing = db.users[email]

  const user: UserRecord = {
    email,
    name: data.name || existing?.name || '',
    image: data.image || existing?.image || '',
    stripeCustomerId: data.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    designCredits: data.designCredits ?? existing?.designCredits ?? 0,
    freeDownloadsToday: data.freeDownloadsToday || existing?.freeDownloadsToday || {
      count: 0,
      resetAt: now + 86400000,
    },
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }

  db.users[email] = user
  writeDb(db)
  return user
}

export function addDesignCredits(email: string, credits: number): UserRecord | null {
  const user = getUser(email)
  if (!user) return null
  return upsertUser(email, {
    designCredits: user.designCredits + credits,
  })
}

/**
 * Intenta usar un crédito de diseño.
 * Si tiene créditos → descuenta 1, sin marca de agua, con upscale.
 * Si no tiene créditos → usa descarga gratuita (con marca de agua, sin upscale).
 */
export function consumeDesignCredit(email: string): { allowed: boolean; usedCredit: boolean; watermark: boolean; reason?: string } {
  const user = getUser(email)
  if (!user) return { allowed: false, usedCredit: false, watermark: true, reason: 'Usuario no encontrado.' }

  // Si tiene créditos de packs, descontar uno
  if (user.designCredits > 0) {
    upsertUser(email, { designCredits: user.designCredits - 1 })
    return { allowed: true, usedCredit: true, watermark: false }
  }

  // Sin créditos → usar descarga gratuita (1/día)
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
  upsertUser(email, { freeDownloadsToday: freeDownloads })
  return { allowed: true, usedCredit: false, watermark: true }
}

/**
 * Verificar si el usuario puede descargar y cuáles son sus condiciones.
 */
export function checkUserDownload(email: string): { allowed: boolean; watermark: boolean; hasCredits: boolean; remainingCredits: number; message?: string } {
  const user = getUser(email)
  if (!user) return { allowed: false, watermark: true, hasCredits: false, remainingCredits: 0, message: 'Usuario no encontrado.' }

  // Si tiene créditos → puede descargar sin marca de agua
  if (user.designCredits > 0) {
    return { allowed: true, watermark: false, hasCredits: true, remainingCredits: user.designCredits }
  }

  // Sin créditos → verificar si ya usó la descarga gratis de hoy
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
export function checkUpscaleAccess(email: string): { allowed: boolean; reason?: string } {
  const user = getUser(email)
  if (!user) return { allowed: false, reason: 'Usuario no encontrado.' }

  if (user.designCredits > 0) {
    return { allowed: true }
  }

  return { allowed: false, reason: 'Necesitas créditos de diseño para mejorar imágenes. Compra un pack.' }
}

// ── Rate Limit por IP (anónimos) ────────────────────────

export function checkIpRateLimit(ip: string): { allowed: boolean; remainingHours?: number; message?: string } {
  const db = readDb()
  const now = Date.now()
  const ONE_DAY = 86400000

  // Limpiar entradas viejas
  for (const [key, timestamp] of Object.entries(db.ipRateLimit)) {
    if (now - timestamp >= ONE_DAY) {
      delete db.ipRateLimit[key]
    }
  }

  const lastDownload = db.ipRateLimit[ip]
  if (lastDownload && now - lastDownload < ONE_DAY) {
    const remainingMs = ONE_DAY - (now - lastDownload)
    const remainingHours = Math.ceil(remainingMs / 3600000)
    writeDb(db)
    return {
      allowed: false,
      remainingHours,
      message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s). Crea una cuenta o compra un pack para más.`,
    }
  }

  writeDb(db)
  return { allowed: true }
}

export function recordIpDownload(ip: string): void {
  const db = readDb()
  db.ipRateLimit[ip] = Date.now()
  writeDb(db)
}

// ── Búsqueda por Stripe Customer ID ────────────────────

export function getUserByStripeCustomerId(customerId: string): UserRecord | null {
  const db = readDb()
  for (const user of Object.values(db.users)) {
    if (user.stripeCustomerId === customerId) {
      return user
    }
  }
  return null
}
