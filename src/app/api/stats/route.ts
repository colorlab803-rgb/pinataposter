import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const db = getDb()

    const visitsByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM page_visits
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date DESC
    `).all()

    const generatorByDay = db.prepare(`
      SELECT date(created_at) as date, action, COUNT(*) as count
      FROM generator_uses
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at), action
      ORDER BY date DESC
    `).all()

    const totalVisits = db.prepare('SELECT COUNT(*) as count FROM page_visits').get() as { count: number }
    const totalGeneratorUses = db.prepare('SELECT COUNT(*) as count FROM generator_uses').get() as { count: number }
    const todayVisits = db.prepare(
      "SELECT COUNT(*) as count FROM page_visits WHERE date(created_at) = date('now')"
    ).get() as { count: number }
    const todayGeneratorUses = db.prepare(
      "SELECT COUNT(*) as count FROM generator_uses WHERE date(created_at) = date('now')"
    ).get() as { count: number }

    return NextResponse.json({
      totalVisits: totalVisits.count,
      totalGeneratorUses: totalGeneratorUses.count,
      todayVisits: todayVisits.count,
      todayGeneratorUses: todayGeneratorUses.count,
      visitsByDay,
      generatorByDay,
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
