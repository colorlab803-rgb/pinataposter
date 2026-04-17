import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth } from '@/lib/firebase-admin'
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const auth = getFirebaseAdminAuth()
    const db = getFirebaseAdminFirestore()

    const users: {
      uid: string
      email: string | undefined
      displayName: string | undefined
      provider: string
      createdAt: string | undefined
      lastSignIn: string | undefined
      photoURL: string | undefined
      premium?: {
        active: boolean
        paymentMethod: string
        amount: number
        paidAt: number
        expiresAt: number
      }
    }[] = []

    // Obtener usuarios premium de Firestore
    const premiumSnap = await db.collection('premium_users').get()
    const premiumMap = new Map<string, Record<string, unknown>>()
    premiumSnap.forEach((doc) => {
      premiumMap.set(doc.id, doc.data())
    })

    let nextPageToken: string | undefined
    do {
      const result = await auth.listUsers(1000, nextPageToken)
      result.users.forEach((user) => {
        const provider = user.providerData[0]?.providerId || 'unknown'
        const premiumData = premiumMap.get(user.uid)

        let premium: typeof users[number]['premium']
        if (premiumData) {
          const expiresAt = premiumData.expiresAt && typeof premiumData.expiresAt === 'object' && 'toMillis' in premiumData.expiresAt
            ? (premiumData.expiresAt as { toMillis: () => number }).toMillis()
            : premiumData.expiresAt as number
          const paidAt = premiumData.paidAt && typeof premiumData.paidAt === 'object' && 'toMillis' in premiumData.paidAt
            ? (premiumData.paidAt as { toMillis: () => number }).toMillis()
            : premiumData.paidAt as number

          premium = {
            active: Date.now() < expiresAt,
            paymentMethod: premiumData.paymentMethod as string,
            amount: premiumData.amount as number,
            paidAt,
            expiresAt,
          }
        }

        users.push({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          provider,
          createdAt: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime,
          photoURL: user.photoURL,
          premium,
        })
      })
      nextPageToken = result.pageToken
    } while (nextPageToken)

    const premiumUsers = users.filter((u) => u.premium?.active)

    const summary = {
      total: users.length,
      premiumActive: premiumUsers.length,
      byProvider: users.reduce<Record<string, number>>((acc, u) => {
        acc[u.provider] = (acc[u.provider] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({ summary, users })
  } catch (error) {
    console.error('Error al listar usuarios:', error)
    return NextResponse.json(
      { error: 'Error al listar usuarios', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
