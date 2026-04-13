import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

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

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return NextResponse.json({
      paid: session.payment_status === 'paid',
      email: session.customer_details?.email || null,
    })
  } catch (error) {
    console.error('Error verificando sesión de Stripe:', error)
    return NextResponse.json({ error: 'Error al verificar pago' }, { status: 500 })
  }
}
