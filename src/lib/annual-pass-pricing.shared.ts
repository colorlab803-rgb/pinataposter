export type AnnualPassPricePhase = 'regular'

export const ANNUAL_PASS_CURRENCY = 'MXN'
export const ANNUAL_PASS_PRICE_CENTS = 5000
export const ANNUAL_PASS_PROMO_PRICE_CENTS = ANNUAL_PASS_PRICE_CENTS
export const ANNUAL_PASS_REGULAR_PRICE_CENTS = ANNUAL_PASS_PRICE_CENTS
export const ANNUAL_PASS_PROMO_DURATION_MS = 0

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

export function formatAnnualPassRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => value.toString().padStart(2, '0')

  if (days > 0) {
    return `${days} ${days === 1 ? 'día' : 'días'} ${pad(hours)} h ${pad(minutes)} min ${pad(seconds)} s`
  }

  if (hours > 0) {
    return `${pad(hours)} h ${pad(minutes)} min ${pad(seconds)} s`
  }

  if (minutes > 0) {
    return `${pad(minutes)} min ${pad(seconds)} s`
  }

  return `${pad(seconds)} s`
}

export function buildAnnualPassPricing(
  _nowMs: number,
  _startsAt: number | null
): AnnualPassPricing {
  return {
    currency: ANNUAL_PASS_CURRENCY,
    phase: 'regular',
    isPromoActive: false,
    priceCents: ANNUAL_PASS_PRICE_CENTS,
    promoPriceCents: ANNUAL_PASS_PROMO_PRICE_CENTS,
    regularPriceCents: ANNUAL_PASS_REGULAR_PRICE_CENTS,
    displayPrice: formatAnnualPassPrice(ANNUAL_PASS_PRICE_CENTS),
    promoDisplayPrice: formatAnnualPassPrice(ANNUAL_PASS_PROMO_PRICE_CENTS),
    regularDisplayPrice: formatAnnualPassPrice(ANNUAL_PASS_REGULAR_PRICE_CENTS),
    startsAt: null,
    endsAt: null,
    startsAtIso: null,
    endsAtIso: null,
    remainingMs: 0,
  }
}

export function getRegularAnnualPassPricing(nowMs: number = Date.now()): AnnualPassPricing {
  return buildAnnualPassPricing(nowMs, null)
}
