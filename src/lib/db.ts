/**
 * Base de datos en archivo JSON persistente.
 * Usa /data en Railway (volumen) o .app-data/ en dev local.
 */

import fs from 'fs'
import path from 'path'
import type { UserTier } from './tiers'

// ── Tipos ───────────────────────────────────────────────

export interface UpscaleUsage {
  hourly: { count: number; resetAt: number }
  daily: { count: number; resetAt: number }
  monthly: { count: number; resetAt: number }
}

export interface UserRecord {
  email: string
  name: string
  image: string
  tier: UserTier
  stripeCustomerId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  upscaleCredits: number          // créditos de packs (compra única)
  upscaleUsage: UpscaleUsage
  downloadsToday: { count: number; resetAt: number }
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
    tier: data.tier || existing?.tier || 'free',
    stripeCustomerId: data.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    subscriptionId: data.subscriptionId ?? existing?.subscriptionId ?? null,
    subscriptionStatus: data.subscriptionStatus ?? existing?.subscriptionStatus ?? null,
    upscaleCredits: data.upscaleCredits ?? existing?.upscaleCredits ?? 0,
    upscaleUsage: data.upscaleUsage || existing?.upscaleUsage || {
      hourly: { count: 0, resetAt: now + 3600000 },
      daily: { count: 0, resetAt: now + 86400000 },
      monthly: { count: 0, resetAt: now + 2592000000 },
    },
    downloadsToday: data.downloadsToday || existing?.downloadsToday || {
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

export function addUpscaleCredits(email: string, credits: number): UserRecord | null {
  const user = getUser(email)
  if (!user) return null
  return upsertUser(email, {
    upscaleCredits: user.upscaleCredits + credits,
  })
}

export function recordUpscaleUsage(email: string): { allowed: boolean; reason?: string } {
  const user = getUser(email)
  if (!user) return { allowed: false, reason: 'Usuario no encontrado.' }

  const now = Date.now()
  const usage = { ...user.upscaleUsage }
  const { TIER_LIMITS } = require('./tiers')
  const limits = TIER_LIMITS[user.tier]

  // Si tiene créditos de packs, usarlos primero (sin importar tier)
  if (user.upscaleCredits > 0) {
    upsertUser(email, { upscaleCredits: user.upscaleCredits - 1 })
    return { allowed: true }
  }

  // Si es free sin login, no tiene upscales
  // (este chequeo se hace en la API, aquí asumimos que está logueado)

  // Reset contadores si expiró el periodo
  if (now >= usage.hourly.resetAt) {
    usage.hourly = { count: 0, resetAt: now + 3600000 }
  }
  if (now >= usage.daily.resetAt) {
    usage.daily = { count: 0, resetAt: now + 86400000 }
  }
  if (now >= usage.monthly.resetAt) {
    usage.monthly = { count: 0, resetAt: now + 2592000000 }
  }

  // Verificar límites
  if (usage.hourly.count >= limits.upscalesPerHour) {
    return { allowed: false, reason: 'Has alcanzado el límite por hora. Espera unos minutos.' }
  }
  if (usage.daily.count >= limits.upscalesPerDay) {
    return { allowed: false, reason: 'Has alcanzado el máximo diario. Podrás continuar mañana.' }
  }
  if (usage.monthly.count >= limits.upscalesPerMonth) {
    return { allowed: false, reason: 'Has alcanzado el uso justo del mes. Tu límite se renueva pronto.' }
  }

  // Incrementar contadores
  usage.hourly.count++
  usage.daily.count++
  usage.monthly.count++

  upsertUser(email, { upscaleUsage: usage })
  return { allowed: true }
}

export function recordDownload(email: string): { allowed: boolean; reason?: string } {
  const user = getUser(email)
  if (!user) return { allowed: false, reason: 'Usuario no encontrado.' }

  const now = Date.now()
  const downloads = { ...user.downloadsToday }
  const { TIER_LIMITS } = require('./tiers')
  const limits = TIER_LIMITS[user.tier]

  // Reset si expiró
  if (now >= downloads.resetAt) {
    downloads.count = 0
    downloads.resetAt = now + 86400000
  }

  if (downloads.count >= limits.downloadsPerDay) {
    return { allowed: false, reason: 'Ya descargaste tu límite de hoy. Podrás descargar más mañana.' }
  }

  downloads.count++
  upsertUser(email, { downloadsToday: downloads })
  return { allowed: true }
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
      message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s).`,
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
