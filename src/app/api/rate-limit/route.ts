import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkUserDownload, consumeDesignCredit, checkIpRateLimit, recordIpDownload } from '@/lib/db'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

/**
 * GET  → Consulta si puede descargar (por email o IP)
 * POST → Registra una descarga (gasta crédito o descarga gratis)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession()

  // Usuario logueado: verificar por email
  if (session?.user?.email) {
    const result = checkUserDownload(session.user.email)
    return NextResponse.json({
      allowed: result.allowed,
      watermark: result.watermark,
      hasCredits: result.hasCredits,
      remainingCredits: result.remainingCredits,
      message: result.message,
    })
  }

  // Anónimo: verificar por IP
  const ip = getClientIp(request)
  const result = checkIpRateLimit(ip)
  return NextResponse.json({ ...result, watermark: true, hasCredits: false, remainingCredits: 0 })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()

  // Usuario logueado
  if (session?.user?.email) {
    const result = consumeDesignCredit(session.user.email)
    if (!result.allowed) {
      return NextResponse.json(
        { allowed: false, watermark: true, message: result.reason },
        { status: 429 }
      )
    }
    return NextResponse.json({
      allowed: true,
      watermark: result.watermark,
      usedCredit: result.usedCredit,
    })
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
