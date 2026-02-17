import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getUser, recordDownload, checkIpRateLimit, recordIpDownload } from '@/lib/db'
import { TIER_LIMITS } from '@/lib/tiers'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

/**
 * GET  → Consulta si puede descargar hoy (por email o IP)
 * POST → Registra una descarga
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession()

  // Usuario logueado: verificar por email
  if (session?.user?.email) {
    const user = getUser(session.user.email)
    if (user) {
      const limits = TIER_LIMITS[user.tier]

      // Premium/Pro: ilimitado
      if (limits.downloadsPerDay === Infinity) {
        return NextResponse.json({ allowed: true, watermark: limits.watermark })
      }

      // Free logueado: verificar conteo
      const now = Date.now()
      const downloads = { ...user.downloadsToday }
      if (now >= downloads.resetAt) downloads.count = 0

      if (downloads.count >= limits.downloadsPerDay) {
        return NextResponse.json({
          allowed: false,
          watermark: limits.watermark,
          message: 'Ya descargaste tu límite de hoy. Hazte Premium para descargas ilimitadas.',
        })
      }

      return NextResponse.json({ allowed: true, watermark: limits.watermark })
    }
  }

  // Anónimo: verificar por IP
  const ip = getClientIp(request)
  const result = checkIpRateLimit(ip)
  return NextResponse.json({ ...result, watermark: true })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()

  // Usuario logueado
  if (session?.user?.email) {
    const user = getUser(session.user.email)
    if (user) {
      const limits = TIER_LIMITS[user.tier]

      // Premium/Pro: ilimitado, solo registrar
      if (limits.downloadsPerDay === Infinity) {
        return NextResponse.json({ allowed: true, watermark: limits.watermark })
      }

      // Free logueado
      const result = recordDownload(session.user.email)
      if (!result.allowed) {
        return NextResponse.json(
          { allowed: false, watermark: true, message: result.reason },
          { status: 429 }
        )
      }
      return NextResponse.json({ allowed: true, watermark: limits.watermark })
    }
  }

  // Anónimo: IP
  const ip = getClientIp(request)
  const check = checkIpRateLimit(ip)
  if (!check.allowed) {
    return NextResponse.json({ ...check, watermark: true }, { status: 429 })
  }

  recordIpDownload(ip)
  return NextResponse.json({ allowed: true, watermark: true, message: 'Descarga registrada.' })
}
