import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { likesApp, feedback } = body

    if (typeof likesApp !== 'boolean') {
      return NextResponse.json({ error: 'likesApp es requerido' }, { status: 400 })
    }

    const db = getFirestore()
    await db.collection('survey_responses').add({
      likes_app: likesApp,
      feedback: feedback || null,
      created_at: new Date(),
    })

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
    const db = getFirestore()
    const snapshot = await db.collection('survey_responses').orderBy('created_at', 'desc').get()

    let total = 0
    let positive = 0
    let negative = 0
    const feedbacks: Array<{ id: string; feedback: string; created_at: string }> = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      total++
      if (data.likes_app) {
        positive++
      } else {
        negative++
        if (data.feedback) {
          feedbacks.push({
            id: doc.id,
            feedback: data.feedback,
            created_at: data.created_at.toDate().toISOString(),
          })
        }
      }
    })

    return NextResponse.json({ total, positive, negative, feedbacks })
  } catch {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
