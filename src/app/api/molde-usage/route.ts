import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'
import { consumeGeneratorQuota, getGeneratorQuotaStatus } from '@/lib/generator-quota'

// POST: Consumir una exportación gratis después de una descarga exitosa
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await consumeGeneratorQuota(user.uid)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en molde-usage:', error)
    return NextResponse.json({ error: 'Error al registrar la exportación' }, { status: 500 })
  }
}

// GET: Consultar estado de la cuota gratis sin consumirla
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await getGeneratorQuotaStatus(user.uid)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en molde-usage GET:', error)
    return NextResponse.json({ error: 'Error al consultar la cuota' }, { status: 500 })
  }
}
