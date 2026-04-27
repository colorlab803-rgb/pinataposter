import { Timestamp } from 'firebase-admin/firestore'
import { getFirestore } from './db'
import { getPremiumData } from './premium-firestore'
import type { CatalogAccess } from './types/catalog-access'

const ROLLOUT_AT_FALLBACK = '2026-04-27T00:00:00-06:00'
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

function getRolloutAtMs(): number {
  const value = process.env.CATALOG_PREMIUM_ROLLOUT_AT || ROLLOUT_AT_FALLBACK
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Date.parse(ROLLOUT_AT_FALLBACK) : parsed
}

function toMillis(value: unknown): number | null {
  if (!value) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'object' && value && 'toMillis' in value && typeof value.toMillis === 'function') {
    return value.toMillis()
  }
  return null
}

function buildLockedAccess(premiumExpiresAt: number | null): CatalogAccess {
  return {
    status: 'locked',
    reason: 'no_premium',
    premiumExpiresAt,
    graceEndsAt: null,
  }
}

export function isCatalogWritable(access: CatalogAccess): boolean {
  return access.status === 'premium'
}

export function isCatalogPubliclyAccessible(access: CatalogAccess): boolean {
  return access.status === 'premium' || access.status === 'grace'
}

export function getCatalogMigrationGraceEndsAt(): number {
  return getRolloutAtMs() + GRACE_PERIOD_MS
}

export async function getCatalogAccessForOwner(
  uid: string,
  storeCreatedAt?: unknown
): Promise<CatalogAccess> {
  const premiumData = await getPremiumData(uid)
  const premiumExpiresAt = premiumData?.expiresAt ?? null

  if (premiumExpiresAt && Date.now() < premiumExpiresAt) {
    return {
      status: 'premium',
      reason: 'active_premium',
      premiumExpiresAt,
      graceEndsAt: null,
    }
  }

  if (premiumExpiresAt) {
    const graceEndsAt = premiumExpiresAt + GRACE_PERIOD_MS
    if (Date.now() < graceEndsAt) {
      return {
        status: 'grace',
        reason: 'premium_expired',
        premiumExpiresAt,
        graceEndsAt,
      }
    }
  }

  if (storeCreatedAt !== undefined) {
    const createdAt = toMillis(storeCreatedAt)
    const rolloutAt = getRolloutAtMs()
    const legacyStore = createdAt === null || createdAt < rolloutAt

    if (legacyStore) {
      const graceEndsAt = getCatalogMigrationGraceEndsAt()
      if (Date.now() < graceEndsAt) {
        return {
          status: 'grace',
          reason: 'legacy_migration',
          premiumExpiresAt,
          graceEndsAt,
        }
      }
    }
  }

  return buildLockedAccess(premiumExpiresAt)
}

export async function getCatalogAccessForUser(uid: string): Promise<CatalogAccess> {
  const db = getFirestore()
  const storeSnap = await db.collection('stores').where('userId', '==', uid).limit(1).get()
  const storeCreatedAt = storeSnap.empty ? undefined : storeSnap.docs[0].data().createdAt

  return getCatalogAccessForOwner(uid, storeCreatedAt)
}
