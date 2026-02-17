import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate-limiter en memoria: máximo 1 póster descargado por IP pública por día.
 * Map<ip, timestamp de la última descarga>
 */
const downloadLog = new Map<string, number>()

// Limpieza periódica cada hora para evitar memory leaks
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hora
const ONE_DAY_MS = 24 * 60 * 60 * 1000

let lastCleanup = Date.now()

function cleanupOldEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [ip, timestamp] of downloadLog.entries()) {
    if (now - timestamp >= ONE_DAY_MS) {
      downloadLog.delete(ip)
    }
  }
}

function getClientIp(request: NextRequest): string {
  // Cabeceras comunes de proxies / plataformas de hosting
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  // Fallback
  return '127.0.0.1'
}

/**
 * GET  → Consulta si la IP puede descargar hoy
 * POST → Registra una descarga para la IP
 */
export async function GET(request: NextRequest) {
  cleanupOldEntries()

  const ip = getClientIp(request)
  const lastDownload = downloadLog.get(ip)
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
  cleanupOldEntries()

  const ip = getClientIp(request)
  const lastDownload = downloadLog.get(ip)
  const now = Date.now()

  if (lastDownload && now - lastDownload < ONE_DAY_MS) {
    const remainingMs = ONE_DAY_MS - (now - lastDownload)
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000))
    return NextResponse.json(
      {
        allowed: false,
        remainingHours,
        message: `Ya descargaste un póster hoy. Podrás descargar otro en aproximadamente ${remainingHours} hora(s).`,
      },
      { status: 429 }
    )
  }

  downloadLog.set(ip, now)

  return NextResponse.json({ allowed: true, message: 'Descarga registrada.' })
}
