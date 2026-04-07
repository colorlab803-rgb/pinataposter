import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, page, action } = body

    const db = getDb()

    if (type === 'visit' && page) {
      db.prepare('INSERT INTO page_visits (page) VALUES (?)').run(page)
    } else if (type === 'generator' && action) {
      db.prepare('INSERT INTO generator_uses (action) VALUES (?)').run(action)
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }
}
