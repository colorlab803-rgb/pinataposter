import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const origin = req.headers.get('origin') || 'https://pinataposter.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'PiñataPoster — Acceso Preferencial',
              description: 'Acceso ilimitado al generador de moldes por 12 meses. Sin interrupciones ni tiempos de espera.',
            },
            unit_amount: 16900, // $169.00 MXN en centavos
          },
          quantity: 1,
        },
      ],
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
