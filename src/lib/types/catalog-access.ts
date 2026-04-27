export type CatalogAccessStatus = 'premium' | 'grace' | 'locked'

export type CatalogAccessReason =
  | 'active_premium'
  | 'legacy_migration'
  | 'premium_expired'
  | 'no_premium'

export interface CatalogAccess {
  status: CatalogAccessStatus
  reason: CatalogAccessReason
  premiumExpiresAt: number | null
  graceEndsAt: number | null
}

export const LOCKED_CATALOG_ACCESS: CatalogAccess = {
  status: 'locked',
  reason: 'no_premium',
  premiumExpiresAt: null,
  graceEndsAt: null,
}
