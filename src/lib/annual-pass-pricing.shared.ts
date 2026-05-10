export type AnnualPassPricePhase = 'promo' | 'regular'

export const ANNUAL_PASS_CURRENCY = 'MXN'
export const ANNUAL_PASS_PROMO_PRICE_CENTS = 5000
export const ANNUAL_PASS_REGULAR_PRICE_CENTS = 15000
export const ANNUAL_PASS_PROMO_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export interface AnnualPassPricing {
  currency: typeof ANNUAL_PASS_CURRENCY
  phase: AnnualPassPricePhase
  isPromoActive: boolean
  priceCents: number
  promoPriceCents: number
  regularPriceCents: number
  displayPrice: string
  promoDisplayPrice: string
  regularDisplayPrice: string
  startsAt: number | null
  endsAt: number | null
  startsAtIso: string | null
  endsAtIso: string | null
  remainingMs: number
}

export function formatAnnualPassPrice(cents: number): string {
  return `$${Math.round(cents / 100)} ${ANNUAL_PASS_CURRENCY}`
}

export function buildAnnualPassPricing(
  nowMs: number,
  startsAt: number | null
): AnnualPassPricing {
  const endsAt = startsAt ? startsAt + ANNUAL_PASS_PROMO_DURATION_MS : null
  const isPromoActive = Boolean(startsAt && endsAt && nowMs >= startsAt && nowMs < endsAt)
  const phase: AnnualPassPricePhase = isPromoActive ? 'promo' : 'regular'
  const priceCents = isPromoActive ? ANNUAL_PASS_PROMO_PRICE_CENTS : ANNUAL_PASS_REGULAR_PRICE_CENTS
  const remainingMs = isPromoActive && endsAt ? Math.max(endsAt - nowMs, 0) : 0

  return {
    currency: ANNUAL_PASS_CURRENCY,
    phase,
    isPromoActive,
    priceCents,
    promoPriceCents: ANNUAL_PASS_PROMO_PRICE_CENTS,
    regularPriceCents: ANNUAL_PASS_REGULAR_PRICE_CENTS,
    displayPrice: formatAnnualPassPrice(priceCents),
    promoDisplayPrice: formatAnnualPassPrice(ANNUAL_PASS_PROMO_PRICE_CENTS),
    regularDisplayPrice: formatAnnualPassPrice(ANNUAL_PASS_REGULAR_PRICE_CENTS),
    startsAt,
    endsAt,
    startsAtIso: startsAt ? new Date(startsAt).toISOString() : null,
    endsAtIso: endsAt ? new Date(endsAt).toISOString() : null,
    remainingMs,
  }
}

export function getRegularAnnualPassPricing(nowMs: number = Date.now()): AnnualPassPricing {
  return buildAnnualPassPricing(nowMs, null)
}
