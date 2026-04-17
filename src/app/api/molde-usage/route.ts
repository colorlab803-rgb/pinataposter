import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin'
import { isPremiumInFirestore } from '@/lib/premium-firestore'

const COLLECTION = 'molde_usage'
const DAILY_LIMIT = 1

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// POST: Intentar registrar un uso de molde (check + record atómico)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const token = authHeader.split('Bearer ')[1]
    const decoded = await verifyIdToken(token)
    const uid = decoded.uid

    // Usuarios premium → siempre permitido
    const premium = await isPremiumInFirestore(uid)
    if (premium) {
      return NextResponse.json({ allowed: true, isPremium: true, usedToday: 0 })
    }

    const db = getFirebaseAdminFirestore()
    const todayKey = getTodayKey()
    const docId = `${uid}_${todayKey}`
    const docRef = db.collection(COLLECTION).doc(docId)

    // Transacción atómica: verificar y registrar
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef)

      if (doc.exists) {
        const data = doc.data()!
        const count = data.count || 0
        if (count >= DAILY_LIMIT) {
          return { allowed: false, usedToday: count }
        }
        transaction.update(docRef, { count: count + 1, lastUsed: new Date() })
        return { allowed: true, usedToday: count + 1 }
      }

      transaction.set(docRef, {
        uid,
        date: todayKey,
        count: 1,
        lastUsed: new Date(),
        createdAt: new Date(),
      })
      return { allowed: true, usedToday: 1 }
    })

    return NextResponse.json({ ...result, isPremium: false })
  } catch (error) {
    console.error('Error en molde-usage:', error)
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 })
  }
}

// GET: Consultar uso del día sin registrar
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const token = authHeader.split('Bearer ')[1]
    const decoded = await verifyIdToken(token)
    const uid = decoded.uid

    const premium = await isPremiumInFirestore(uid)
    if (premium) {
      return NextResponse.json({ canGenerate: true, isPremium: true, usedToday: 0 })
    }

    const db = getFirebaseAdminFirestore()
    const todayKey = getTodayKey()
    const docId = `${uid}_${todayKey}`
    const doc = await db.collection(COLLECTION).doc(docId).get()

    const usedToday = doc.exists ? (doc.data()?.count || 0) : 0

    return NextResponse.json({
      canGenerate: usedToday < DAILY_LIMIT,
      isPremium: false,
      usedToday,
    })
  } catch (error) {
    console.error('Error en molde-usage GET:', error)
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 })
  }
}
