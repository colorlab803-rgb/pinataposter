import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getStripe } from '@/lib/stripe'
import { getUser } from '@/lib/db'

/**
 * POST /api/stripe/portal
 * Redirige al portal de Stripe para gestionar suscripción.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  const user = getUser(session.user.email)

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No tienes una cuenta de pago asociada.' },
      { status: 400 }
    )
  }

  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/generator`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Error al abrir el portal de pagos.' },
      { status: 500 }
    )
  }
}
