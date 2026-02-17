import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { upsertUser, getUserByStripeCustomerId, addDesignCredits } from '@/lib/db'
import { PACK_CREDITS } from '@/lib/tiers'

/**
 * POST /api/stripe/webhook
 * Recibe eventos de Stripe para acreditar packs de diseños.
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook no configurado.' }, { status: 400 })
  }

  let event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ── Checkout completado (pago de pack) ──────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer as string
        const email = session.metadata?.email || session.customer_details?.email
        const priceId = session.metadata?.priceId

        if (!email) {
          console.error('Webhook: no email in checkout session')
          break
        }

        if (session.mode === 'payment') {
          const credits = determinePackCredits(priceId || '')
          if (credits > 0) {
            // Asegurar que el usuario existe
            const user = getUserByStripeCustomerId(customerId)
            if (user) {
              addDesignCredits(user.email, credits)
            } else {
              upsertUser(email, { stripeCustomerId: customerId })
              addDesignCredits(email, credits)
            }
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Error procesando webhook.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Helpers ─────────────────────────────────────────────

function determinePackCredits(priceId: string): number {
  const pack5 = process.env.STRIPE_PRICE_PACK_5 || ''
  const pack15 = process.env.STRIPE_PRICE_PACK_15 || ''
  const pack50 = process.env.STRIPE_PRICE_PACK_50 || ''

  if (priceId === pack5) return PACK_CREDITS.pack_5
  if (priceId === pack15) return PACK_CREDITS.pack_15
  if (priceId === pack50) return PACK_CREDITS.pack_50
  return 0
}
