import { buildAnnualPassPricing } from './annual-pass-pricing.shared'
import type { AnnualPassPricing } from './annual-pass-pricing.shared'

export function getAnnualPassPricing(nowMs = Date.now()): AnnualPassPricing {
  return buildAnnualPassPricing(nowMs, null)
}

export type { AnnualPassPricing } from './annual-pass-pricing.shared'
