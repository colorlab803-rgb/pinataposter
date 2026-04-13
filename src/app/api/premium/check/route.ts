import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { isPremiumInFirestore, getPremiumData } from '@/lib/premium-firestore'

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
      const data = await getPremiumData(uid)
      return NextResponse.json({
        premium: true,
        expiresAt: data?.expiresAt || null,
        paymentMethod: data?.paymentMethod || null,
      })
    }

    return NextResponse.json({ premium: false })
  } catch (error) {
    console.error('Error verificando premium:', error)
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 })
  }
}
