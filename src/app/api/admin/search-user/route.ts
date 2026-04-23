import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth } from '@/lib/firebase-admin'
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin'
import { isPremiumInFirestore, getPremiumData } from '@/lib/premium-firestore'

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  try {
    const auth = getFirebaseAdminAuth()
    const db = getFirebaseAdminFirestore()

    // Buscar usuario por email en Firebase Auth
    const users = await auth.getUserByEmail(email)
    if (!users) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const user = users
    const provider = user.providerData[0]?.providerId || 'unknown'

    // Verificar si es premium
    const premiumActive = await isPremiumInFirestore(user.uid)
    let premiumData = null

    if (premiumActive) {
      const data = await getPremiumData(user.uid)
      if (data) {
        premiumData = {
          active: true,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
          paidAt: data.paidAt,
          expiresAt: data.expiresAt,
        }
      }
    }

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      provider,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      photoURL: user.photoURL,
      premium: premiumData,
    })
  } catch (error) {
    console.error('Error al buscar usuario:', error)
    if ((error as { code?: string }).code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Error al buscar usuario', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
