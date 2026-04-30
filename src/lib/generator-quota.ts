import { getPremiumData } from './premium-firestore'

export const FREE_EXPORT_LIMIT = 0

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

function buildLockedStatus(): GeneratorQuotaStatus {
  return {
    canGenerate: false,
    exhausted: true,
    freeLimit: FREE_EXPORT_LIMIT,
    isPremium: false,
    remainingFree: 0,
    usedCount: 0,
  }
}

function buildPremiumStatus(): GeneratorQuotaStatus {
  return {
    canGenerate: true,
    exhausted: false,
    freeLimit: FREE_EXPORT_LIMIT,
    isPremium: true,
    remainingFree: 0,
    usedCount: 0,
  }
}

async function resolveGeneratorAccess(uid: string): Promise<GeneratorQuotaConsumeResult> {
  const premiumData = await getPremiumData(uid)
  const premiumActive = premiumData ? Date.now() < premiumData.expiresAt : false

  if (premiumActive) {
    return {
      ...buildPremiumStatus(),
      consumed: false,
    }
  }

  return {
    ...buildLockedStatus(),
    consumed: false,
  }
}

export async function getGeneratorQuotaStatus(uid: string): Promise<GeneratorQuotaStatus> {
  const result = await resolveGeneratorAccess(uid)
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
  return resolveGeneratorAccess(uid)
}
