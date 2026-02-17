import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getStripe } from '@/lib/stripe'
import { getUser, upsertUser } from '@/lib/db'

/**
 * POST /api/stripe/checkout
 * Body: { priceId: string, mode: 'subscription' | 'payment' }
 *
 * Crea una sesión de Stripe Checkout para suscripciones o packs.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión para comprar.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { priceId, mode } = body as { priceId?: string; mode?: string }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Falta el priceId.' },
        { status: 400 }
      )
    }

    const checkoutMode = mode === 'payment' ? 'payment' : 'subscription'

    // Obtener o crear Stripe Customer
    let user = getUser(session.user.email)
    let customerId = user?.stripeCustomerId

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: { source: 'pinataposter' },
      })
      customerId = customer.id
      upsertUser(session.user.email, { stripeCustomerId: customerId })
      user = getUser(session.user.email)
    }

    // Si ya tiene suscripción activa y quiere otra suscripción, redirigir al portal
    if (
      checkoutMode === 'subscription' &&
      user?.subscriptionId &&
      user.subscriptionStatus === 'active'
    ) {
      const portalSession = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/generator`,
      })
      return NextResponse.json({ url: portalSession.url })
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: checkoutMode as 'subscription' | 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/generator?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/generator?payment=cancel`,
      metadata: {
        email: session.user.email,
        priceId,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago.' },
      { status: 500 }
    )
  }
}
