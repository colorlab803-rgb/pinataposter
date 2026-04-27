import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { setPremiumInFirestore } from '@/lib/premium-firestore'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (webhookSecret) {
      if (!sig) {
        return NextResponse.json({ error: 'Falta firma de Stripe' }, { status: 400 })
      }
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      // Sin webhook secret (solo desarrollo local)
      console.warn('⚠️ Webhook sin verificación de firma — solo para desarrollo')
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('Error verificando webhook de Stripe:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Para pagos con tarjeta, payment_status será 'paid'
        // Para OXXO, será 'unpaid' (se paga después)
        if (session.payment_status === 'paid') {
          await activatePremium(session, 'card')
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        // OXXO: el usuario pagó en la tienda
        const session = event.data.object as Stripe.Checkout.Session
        await activatePremium(session, 'oxxo')
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.warn(`Pago OXXO fallido para sesión ${session.id}`, session.metadata)
        break
      }
    }
  } catch (error) {
    console.error('Error procesando webhook:', error)
    return NextResponse.json({ error: 'Error procesando evento' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function activatePremium(session: Stripe.Checkout.Session, paymentMethod: 'card' | 'oxxo') {
  const uid = session.metadata?.uid
  const email = session.metadata?.email || session.customer_details?.email || ''

  if (!uid) {
    console.error('Webhook: sesión sin uid en metadata', session.id)
    return
  }

  await setPremiumInFirestore(uid, email, session.id, paymentMethod, session.amount_total || 5000)
}
