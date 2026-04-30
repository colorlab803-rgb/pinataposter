import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, page, action } = body

    if ((type !== 'visit' || !page) && (type !== 'generator' || !action)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    try {
      const db = getFirestore()

      if (type === 'visit') {
        await db.collection('page_visits').add({
          page,
          created_at: new Date(),
        })
      } else {
        await db.collection('generator_uses').add({
          action,
          created_at: new Date(),
        })
      }
    } catch (error) {
      console.warn('Tracking omitido:', error instanceof Error ? error.message : error)
      return NextResponse.json({ success: true, tracked: false })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en /api/track:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }
}
