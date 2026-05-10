import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { getAnnualPassPricing } from '@/lib/annual-pass-pricing'
import { getStripe } from '@/lib/stripe'

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
    const pricing = getAnnualPassPricing()
    const origin = req.headers.get('origin') || 'https://pinataposter.com'
    const checkoutDescription = pricing.isPromoActive
      ? `Promoción Día de las Madres: ${pricing.displayPrice} por 12 meses de PiñataPoster ilimitado. Después costará ${pricing.regularDisplayPrice}.`
      : `Pase anual de ${pricing.displayPrice}. Incluye 12 meses de PiñataPoster ilimitado.`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'oxxo'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'PiñataPoster — Pase anual ilimitado',
              description: checkoutDescription,
            },
            unit_amount: pricing.priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        uid,
        email,
        pricePhase: pricing.phase,
        priceCents: String(pricing.priceCents),
        promoStartsAt: pricing.startsAtIso || '',
        promoEndsAt: pricing.endsAtIso || '',
      },
      payment_intent_data: {
        metadata: {
          uid,
          email,
          pricePhase: pricing.phase,
          priceCents: String(pricing.priceCents),
          promoStartsAt: pricing.startsAtIso || '',
          promoEndsAt: pricing.endsAtIso || '',
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
