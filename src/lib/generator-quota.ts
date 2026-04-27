import { Timestamp } from 'firebase-admin/firestore'
import { getFirebaseAdminFirestore } from './firebase-admin'
import { getPremiumData } from './premium-firestore'

const COLLECTION = 'generator_quota'
export const FREE_EXPORT_LIMIT = 5

export interface GeneratorQuotaStatus {
  canGenerate: boolean
  exhausted: boolean
  freeLimit: number
  isPremium: boolean
  remainingFree: number
  usedCount: number
}

export interface GeneratorQuotaConsumeResult extends GeneratorQuotaStatus {
  consumed: boolean
}

function buildGrantKey(expiresAt: number | null): string {
  return expiresAt ? `premium-expiry:${expiresAt}` : 'initial'
}

function buildStatus(usedCount: number): GeneratorQuotaStatus {
  const remainingFree = Math.max(0, FREE_EXPORT_LIMIT - usedCount)

  return {
    canGenerate: remainingFree > 0,
    exhausted: remainingFree <= 0,
    freeLimit: FREE_EXPORT_LIMIT,
    isPremium: false,
    remainingFree,
    usedCount,
  }
}

function buildPremiumStatus(): GeneratorQuotaStatus {
  return {
    canGenerate: true,
    exhausted: false,
    freeLimit: FREE_EXPORT_LIMIT,
    isPremium: true,
    remainingFree: FREE_EXPORT_LIMIT,
    usedCount: 0,
  }
}

async function resolveFreeQuota(uid: string, consume: boolean): Promise<GeneratorQuotaConsumeResult> {
  const db = getFirebaseAdminFirestore()
  const premiumData = await getPremiumData(uid)
  const premiumActive = premiumData ? Date.now() < premiumData.expiresAt : false

  if (premiumActive) {
    return {
      ...buildPremiumStatus(),
      consumed: false,
    }
  }

  const expectedGrantKey = buildGrantKey(premiumData?.expiresAt ?? null)
  const docRef = db.collection(COLLECTION).doc(uid)

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef)
    const existing = snapshot.data()
    const now = Timestamp.now()

    const needsReset =
      !snapshot.exists ||
      existing?.grantKey !== expectedGrantKey ||
      existing?.freeLimit !== FREE_EXPORT_LIMIT ||
      typeof existing?.usedCount !== 'number'

    let usedCount = needsReset ? 0 : existing.usedCount
    let consumed = false

    if (consume && usedCount < FREE_EXPORT_LIMIT) {
      usedCount += 1
      consumed = true
    }

    if (needsReset || consumed) {
      transaction.set(
        docRef,
        {
          uid,
          freeLimit: FREE_EXPORT_LIMIT,
          usedCount,
          grantKey: expectedGrantKey,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        },
        { merge: true }
      )
    }

    return {
      ...buildStatus(usedCount),
      consumed,
    }
  })
}

export async function getGeneratorQuotaStatus(uid: string): Promise<GeneratorQuotaStatus> {
  const result = await resolveFreeQuota(uid, false)
  return {
    canGenerate: result.canGenerate,
    exhausted: result.exhausted,
    freeLimit: result.freeLimit,
    isPremium: result.isPremium,
    remainingFree: result.remainingFree,
    usedCount: result.usedCount,
  }
}

export async function consumeGeneratorQuota(uid: string): Promise<GeneratorQuotaConsumeResult> {
  return resolveFreeQuota(uid, true)
}
