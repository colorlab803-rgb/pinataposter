import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { upsertUser, getUserByStripeCustomerId, addUpscaleCredits } from '@/lib/db'
import { UPSCALE_PACKS } from '@/lib/tiers'
import type { UserTier } from '@/lib/tiers'

/**
 * POST /api/stripe/webhook
 * Recibe eventos de Stripe para activar/desactivar suscripciones y acreditar packs.
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
      // ── Checkout completado ─────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer as string
        const email = session.metadata?.email || session.customer_details?.email
        const priceId = session.metadata?.priceId

        if (!email) {
          console.error('Webhook: no email in checkout session')
          break
        }

        if (session.mode === 'subscription') {
          // Determinar tier según el priceId
          const tier = determineTierFromPrice(priceId || '')
          upsertUser(email, {
            stripeCustomerId: customerId,
            subscriptionId: session.subscription as string,
            subscriptionStatus: 'active',
            tier,
          })
        } else if (session.mode === 'payment') {
          // Pack de upscales
          const packCredits = determinePackCredits(priceId || '')
          if (packCredits > 0) {
            // Asegurar que el usuario existe
            const user = getUserByStripeCustomerId(customerId)
            if (user) {
              addUpscaleCredits(user.email, packCredits)
            } else if (email) {
              upsertUser(email, { stripeCustomerId: customerId })
              addUpscaleCredits(email, packCredits)
            }
          }
        }
        break
      }

      // ── Suscripción actualizada ─────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string
        const user = getUserByStripeCustomerId(customerId)

        if (user) {
          const status = subscription.status
          const priceId = subscription.items?.data?.[0]?.price?.id || ''
          const tier = determineTierFromPrice(priceId)

          if (status === 'active') {
            upsertUser(user.email, {
              subscriptionStatus: 'active',
              tier,
            })
          } else if (status === 'past_due' || status === 'unpaid') {
            upsertUser(user.email, {
              subscriptionStatus: status,
            })
          }
        }
        break
      }

      // ── Suscripción cancelada ───────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string
        const user = getUserByStripeCustomerId(customerId)

        if (user) {
          upsertUser(user.email, {
            tier: 'free',
            subscriptionId: null,
            subscriptionStatus: null,
          })
        }
        break
      }

      // ── Pago de factura exitoso (renovación) ────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const customerId = invoice.customer as string
        const user = getUserByStripeCustomerId(customerId)

        if (user && invoice.billing_reason === 'subscription_cycle') {
          // Renovación mensual - asegurar tier activo
          const lineItem = invoice.lines?.data?.[0] as unknown as Record<string, unknown> | undefined
          const priceObj = lineItem?.price as Record<string, unknown> | undefined
          const priceId = (priceObj?.id as string) || ''
          const tier = determineTierFromPrice(priceId)
          upsertUser(user.email, {
            subscriptionStatus: 'active',
            tier,
          })
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

function determineTierFromPrice(priceId: string): UserTier {
  const premiumPriceId = process.env.STRIPE_PRICE_PREMIUM || ''
  const proPriceId = process.env.STRIPE_PRICE_PRO || ''

  if (priceId === proPriceId) return 'pro'
  if (priceId === premiumPriceId) return 'premium'
  return 'free'
}

function determinePackCredits(priceId: string): number {
  const pack25 = process.env.STRIPE_PRICE_PACK_25 || ''
  const pack50 = process.env.STRIPE_PRICE_PACK_50 || ''
  const pack200 = process.env.STRIPE_PRICE_PACK_200 || ''

  if (priceId === pack25) return UPSCALE_PACKS.pack_25
  if (priceId === pack50) return UPSCALE_PACKS.pack_50
  if (priceId === pack200) return UPSCALE_PACKS.pack_200
  return 0
}
