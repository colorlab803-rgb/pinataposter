import { NextRequest, NextResponse } from 'next/server'
import { getPremiumData, setPremiumInFirestore } from '@/lib/premium-firestore'

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { uid, email } = body

    if (!uid || !email) {
      return NextResponse.json({ error: 'UID y email requeridos' }, { status: 400 })
    }

    // Activar premium por 12 meses con método manual
    await setPremiumInFirestore(uid, email, 'manual_activation', 'manual', 5000)
    const premiumData = await getPremiumData(uid)

    return NextResponse.json({
      success: true,
      message: 'Premium activado exitosamente',
      data: {
        uid,
        email,
        expiresAt: premiumData?.expiresAt ?? null,
        paymentMethod: 'manual',
        amount: 5000,
      },
    })
  } catch (error) {
    console.error('Error al activar premium:', error)
    return NextResponse.json(
      { error: 'Error al activar premium', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
