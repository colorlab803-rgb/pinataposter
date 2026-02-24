/**
 * Base de datos PostgreSQL.
 * Se conecta usando DATABASE_URL.
 * 
 * Funciones de rate-limit por IP.
 */

import { Pool } from 'pg'

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
    CREATE TABLE IF NOT EXISTS ip_rate_limit (
      ip TEXT PRIMARY KEY,
      last_download BIGINT NOT NULL
    );
  `)
  initialized = true
}

// ── Rate Limit por IP ───────────────────────────────────

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
        message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s).`,
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


