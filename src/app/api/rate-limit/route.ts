import { NextRequest, NextResponse } from 'next/server'
import { checkIpRateLimit, recordIpDownload } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

/**
 * GET  → Consulta si puede descargar (por IP)
 * POST → Registra una descarga (por IP)
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const result = await checkIpRateLimit(ip)
  return NextResponse.json(result, { headers: NO_CACHE_HEADERS })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const check = await checkIpRateLimit(ip)
  if (!check.allowed) {
    return NextResponse.json(check, { status: 429, headers: NO_CACHE_HEADERS })
  }

  await recordIpDownload(ip)
  return NextResponse.json({ allowed: true, message: 'Descarga registrada.' }, { headers: NO_CACHE_HEADERS })
}
