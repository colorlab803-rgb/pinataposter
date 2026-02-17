import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Rate-limiter persistente en disco (JSON).
 * Sobrevive reinicios del servidor y re-deploys en Railway
 * si se monta un volumen en /data (o usa /tmp como fallback).
 *
 * Estructura: { [ip: string]: number (timestamp) }
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Railway persistent volume se monta típicamente en /data
// Fallback a /tmp si /data no existe (dev local, o sin volumen)
function getDataDir(): string {
  const railwayVolume = '/data'
  if (process.platform !== 'win32' && fs.existsSync(railwayVolume)) {
    return railwayVolume
  }
  // En Windows (dev local) o sin volumen, usar directorio temporal del proyecto
  const localDir = path.join(process.cwd(), '.rate-limit-data')
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true })
  }
  return localDir
}

function getFilePath(): string {
  return path.join(getDataDir(), 'rate-limit.json')
}

function readLog(): Record<string, number> {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return {}
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeLog(log: Record<string, number>): void {
  try {
    const filePath = getFilePath()
    fs.writeFileSync(filePath, JSON.stringify(log), 'utf-8')
  } catch (err) {
    console.error('Error al escribir rate-limit log:', err)
  }
}

function cleanupOldEntries(log: Record<string, number>): Record<string, number> {
  const now = Date.now()
  const cleaned: Record<string, number> = {}
  for (const [ip, timestamp] of Object.entries(log)) {
    if (now - timestamp < ONE_DAY_MS) {
      cleaned[ip] = timestamp
    }
  }
  return cleaned
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

/**
 * GET  → Consulta si la IP puede descargar hoy
 * POST → Registra una descarga para la IP
 */
export async function GET(request: NextRequest) {
  const log = cleanupOldEntries(readLog())
  writeLog(log)

  const ip = getClientIp(request)
  const lastDownload = log[ip]
  const now = Date.now()

  if (lastDownload && now - lastDownload < ONE_DAY_MS) {
    const remainingMs = ONE_DAY_MS - (now - lastDownload)
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000))
    return NextResponse.json({
      allowed: false,
      remainingHours,
      message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s).`,
    })
  }

  return NextResponse.json({ allowed: true })
}

export async function POST(request: NextRequest) {
  const log = cleanupOldEntries(readLog())

  const ip = getClientIp(request)
  const lastDownload = log[ip]
  const now = Date.now()

  if (lastDownload && now - lastDownload < ONE_DAY_MS) {
    const remainingMs = ONE_DAY_MS - (now - lastDownload)
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000))
    writeLog(log)
    return NextResponse.json(
      {
        allowed: false,
        remainingHours,
        message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s).`,
      },
      { status: 429 }
    )
  }

  log[ip] = now
  writeLog(log)

  return NextResponse.json({ allowed: true, message: 'Descarga registrada.' })
}
