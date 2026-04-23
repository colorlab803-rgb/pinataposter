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
  
  await db.collection(COLLECTION).doc(uid).set({
    uid,
    email,
    expiresAt: Timestamp.fromMillis(now + ONE_YEAR_MS),
    stripeSessionId,
    paymentMethod,
    paidAt: Timestamp.fromMillis(now),
    amount,
  })
}

export async function isPremiumInFirestore(uid: string): Promise<boolean> {
  const db = getFirebaseAdminFirestore()
  const doc = await db.collection(COLLECTION).doc(uid).get()
  
  if (!doc.exists) return false
  
  const data = doc.data()
  if (!data?.expiresAt) return false
  
  const expiresAt = data.expiresAt instanceof Timestamp
    ? data.expiresAt.toMillis()
    : data.expiresAt
  
  return Date.now() < expiresAt
}

export async function getPremiumData(uid: string): Promise<PremiumData | null> {
  const db = getFirebaseAdminFirestore()
  const doc = await db.collection(COLLECTION).doc(uid).get()
  
  if (!doc.exists) return null
  
  const data = doc.data()!
  const expiresAt = data.expiresAt instanceof Timestamp
    ? data.expiresAt.toMillis()
    : data.expiresAt
  const paidAt = data.paidAt instanceof Timestamp
    ? data.paidAt.toMillis()
    : data.paidAt
  
  return {
    uid: data.uid,
    email: data.email,
    expiresAt,
    stripeSessionId: data.stripeSessionId,
    paymentMethod: data.paymentMethod,
    paidAt,
    amount: data.amount,
  }
}
