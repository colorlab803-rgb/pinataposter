import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyIdToken } from '@/lib/firebase-admin'
import { setPremiumInFirestore } from '@/lib/premium-firestore'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
  }

  const authHeader = req.headers.get('Authorization')
  let authenticatedUid: string | null = null
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1]
      const decoded = await verifyIdToken(token)
      authenticatedUid = decoded.uid
    } catch {
      // Token inválido — continuar sin autenticación
    }
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    const paid = session.payment_status === 'paid'
    const email = session.customer_details?.email || session.metadata?.email || null
    const paymentStatus = session.payment_status

    // Si el pago está completado y tenemos un usuario autenticado, guardar en Firestore
    // Verificar que el uid del pago coincida con el usuario autenticado (prevenir hijacking)
    if (paid && authenticatedUid) {
      const sessionUid = session.metadata?.uid
      if (sessionUid && sessionUid !== authenticatedUid) {
        return NextResponse.json({ error: 'Sesión de pago no corresponde a tu cuenta' }, { status: 403 })
      }

      await setPremiumInFirestore(
        authenticatedUid,
        email || '',
        sessionId,
        'card',
        session.amount_total || 5000
      )
    }

    return NextResponse.json({
      paid,
      email,
      paymentStatus,
      uid: session.metadata?.uid || null,
    })
  } catch (error) {
    console.error('Error verificando sesión de Stripe:', error)
    return NextResponse.json({ error: 'Error al verificar pago' }, { status: 500 })
  }
}
