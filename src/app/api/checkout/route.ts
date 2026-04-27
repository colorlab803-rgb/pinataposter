import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyIdToken } from '@/lib/firebase-admin'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para continuar' },
        { status: 401 }
      )
    }

    let uid: string
    let email: string
    try {
      const decoded = await verifyIdToken(idToken)
      uid = decoded.uid
      email = decoded.email || ''
    } catch {
      return NextResponse.json(
        { error: 'Sesión inválida. Inicia sesión de nuevo.' },
        { status: 401 }
      )
    }

    const stripe = getStripe()
    const origin = req.headers.get('origin') || 'https://pinataposter.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'oxxo'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'PiñataPoster — Acceso Ilimitado',
              description: 'Moldes ilimitados y catálogo digital por 12 meses.',
            },
            unit_amount: 5000,
          },
          quantity: 1,
        },
      ],
      metadata: {
        uid,
        email,
      },
      payment_intent_data: {
        metadata: {
          uid,
          email,
        },
      },
      success_url: `${origin}/premium/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/generator`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    )
  }
}
