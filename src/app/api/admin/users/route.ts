import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const auth = getFirebaseAdminAuth()
    const users: {
      uid: string
      email: string | undefined
      displayName: string | undefined
      provider: string
      createdAt: string | undefined
      lastSignIn: string | undefined
      photoURL: string | undefined
    }[] = []

    let nextPageToken: string | undefined
    do {
      const result = await auth.listUsers(1000, nextPageToken)
      result.users.forEach((user) => {
        const provider = user.providerData[0]?.providerId || 'unknown'
        users.push({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          provider,
          createdAt: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime,
          photoURL: user.photoURL,
        })
      })
      nextPageToken = result.pageToken
    } while (nextPageToken)

    const summary = {
      total: users.length,
      byProvider: users.reduce<Record<string, number>>((acc, u) => {
        acc[u.provider] = (acc[u.provider] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({ summary, users })
  } catch {
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 })
  }
}
