import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const db = getFirestore()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Visitas últimos 30 días
    const visitsSnap = await db.collection('page_visits')
      .where('created_at', '>=', thirtyDaysAgo)
      .orderBy('created_at', 'desc')
      .get()

    const visitsByDay: Record<string, number> = {}
    let todayVisits = 0

    visitsSnap.forEach((doc) => {
      const date = doc.data().created_at.toDate()
      const key = date.toISOString().split('T')[0]
      visitsByDay[key] = (visitsByDay[key] || 0) + 1
      if (date >= todayStart) todayVisits++
    })

    // Usos del generador últimos 30 días
    const generatorSnap = await db.collection('generator_uses')
      .where('created_at', '>=', thirtyDaysAgo)
      .orderBy('created_at', 'desc')
      .get()

    const generatorByDay: Record<string, Record<string, number>> = {}
    let todayGeneratorUses = 0

    generatorSnap.forEach((doc) => {
      const data = doc.data()
      const date = data.created_at.toDate()
      const key = date.toISOString().split('T')[0]
      if (!generatorByDay[key]) generatorByDay[key] = {}
      generatorByDay[key][data.action] = (generatorByDay[key][data.action] || 0) + 1
      if (date >= todayStart) todayGeneratorUses++
    })

    // Totales generales
    const totalVisitsSnap = await db.collection('page_visits').count().get()
    const totalGeneratorSnap = await db.collection('generator_uses').count().get()

    return NextResponse.json({
      totalVisits: totalVisitsSnap.data().count,
      totalGeneratorUses: totalGeneratorSnap.data().count,
      todayVisits,
      todayGeneratorUses,
      visitsByDay: Object.entries(visitsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date)),
      generatorByDay: Object.entries(generatorByDay)
        .flatMap(([date, actions]) =>
          Object.entries(actions).map(([action, count]) => ({ date, action, count }))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
