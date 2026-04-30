import { getFirebaseAdminFirestore } from './firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

const COLLECTION = 'premium_users'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

export interface PremiumData {
  uid: string
  email: string
  expiresAt: number
  stripeSessionId: string
  paymentMethod: 'card' | 'oxxo' | 'manual'
  paidAt: number
  amount: number
  processedStripeSessionIds?: string[]
}

function toMillis(value: unknown): number | null {
  if (!value) return null
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number') return value
  if (
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis()
  }
  return null
}

export async function setPremiumInFirestore(
  uid: string,
  email: string,
  stripeSessionId: string,
  paymentMethod: 'card' | 'oxxo' | 'manual',
  amount: number = 5000
): Promise<void> {
  const db = getFirebaseAdminFirestore()
  const now = Date.now()

  const docRef = db.collection(COLLECTION).doc(uid)
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef)
    const existing = snapshot.data()
    const existingExpiresAt = toMillis(existing?.expiresAt)
    const processedStripeSessionIds = Array.isArray(existing?.processedStripeSessionIds)
      ? existing.processedStripeSessionIds.filter((value: unknown): value is string => typeof value === 'string')
      : []

    const shouldDedupeSession = paymentMethod !== 'manual'
    const alreadyProcessed =
      shouldDedupeSession &&
      (existing?.stripeSessionId === stripeSessionId || processedStripeSessionIds.includes(stripeSessionId))

    if (alreadyProcessed) {
      return
    }

    const startsAt = existingExpiresAt && existingExpiresAt > now ? existingExpiresAt : now
    const nextProcessedStripeSessionIds = shouldDedupeSession
      ? [...processedStripeSessionIds, stripeSessionId].slice(-20)
      : processedStripeSessionIds
    const nextEmail = email || (typeof existing?.email === 'string' ? existing.email : '')

    transaction.set(docRef, {
      uid,
      email: nextEmail,
      expiresAt: Timestamp.fromMillis(startsAt + ONE_YEAR_MS),
      stripeSessionId,
      paymentMethod,
      paidAt: Timestamp.fromMillis(now),
      amount,
      processedStripeSessionIds: nextProcessedStripeSessionIds,
    }, { merge: true })
  })
}

export async function isPremiumInFirestore(uid: string): Promise<boolean> {
  const db = getFirebaseAdminFirestore()
  const doc = await db.collection(COLLECTION).doc(uid).get()
  
  if (!doc.exists) return false
  
  const data = doc.data()
  if (!data?.expiresAt) return false
  
  const expiresAt = toMillis(data.expiresAt)
  if (!expiresAt) return false
  
  return Date.now() < expiresAt
}

export async function getPremiumData(uid: string): Promise<PremiumData | null> {
  const db = getFirebaseAdminFirestore()
  const doc = await db.collection(COLLECTION).doc(uid).get()
  
  if (!doc.exists) return null
  
  const data = doc.data()!
  const expiresAt = toMillis(data.expiresAt) ?? 0
  const paidAt = toMillis(data.paidAt) ?? 0
  
  return {
    uid: data.uid,
    email: data.email,
    expiresAt,
    stripeSessionId: data.stripeSessionId,
    paymentMethod: data.paymentMethod,
    paidAt,
    amount: data.amount,
    processedStripeSessionIds: Array.isArray(data.processedStripeSessionIds)
      ? data.processedStripeSessionIds.filter((value: unknown): value is string => typeof value === 'string')
      : undefined,
  }
}
