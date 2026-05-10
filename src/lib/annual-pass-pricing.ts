import { buildAnnualPassPricing } from './annual-pass-pricing.shared'
import type { AnnualPassPricing } from './annual-pass-pricing.shared'

export function parseAnnualPassPromoStartAt(rawValue = process.env.ANNUAL_PASS_PROMO_START_AT): number | null {
  const value = rawValue?.trim()
  if (!value) return null

  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null

  return parsed
}

export function getAnnualPassPricing(nowMs = Date.now()): AnnualPassPricing {
  return buildAnnualPassPricing(nowMs, parseAnnualPassPromoStartAt())
}

export type { AnnualPassPricing } from './annual-pass-pricing.shared'
