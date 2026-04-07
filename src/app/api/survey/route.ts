import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { likesApp, feedback } = body

    if (typeof likesApp !== 'boolean') {
      return NextResponse.json({ error: 'likesApp es requerido' }, { status: 400 })
    }

    const db = getDb()
    db.prepare('INSERT INTO survey_responses (likes_app, feedback) VALUES (?, ?)').run(
      likesApp ? 1 : 0,
      feedback || null
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar respuesta' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const db = getDb()

    const total = db.prepare('SELECT COUNT(*) as count FROM survey_responses').get() as { count: number }
    const positive = db.prepare('SELECT COUNT(*) as count FROM survey_responses WHERE likes_app = 1').get() as { count: number }
    const negative = db.prepare('SELECT COUNT(*) as count FROM survey_responses WHERE likes_app = 0').get() as { count: number }
    const feedbacks = db.prepare(
      'SELECT id, feedback, created_at FROM survey_responses WHERE likes_app = 0 AND feedback IS NOT NULL ORDER BY created_at DESC'
    ).all()

    return NextResponse.json({
      total: total.count,
      positive: positive.count,
      negative: negative.count,
      feedbacks,
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
