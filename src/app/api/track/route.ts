import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, page, action } = body

    const db = getFirestore()

    if (type === 'visit' && page) {
      await db.collection('page_visits').add({
        page,
        created_at: new Date(),
      })
    } else if (type === 'generator' && action) {
      await db.collection('generator_uses').add({
        action,
        created_at: new Date(),
      })
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en /api/track:', error)
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }
}
