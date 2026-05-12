import test from 'node:test'
import assert from 'node:assert/strict'

const pricingModule = await import('../src/lib/annual-pass-pricing.shared.ts')

const {
  ANNUAL_PASS_PRICE_CENTS,
  ANNUAL_PASS_REGULAR_PRICE_CENTS,
  buildAnnualPassPricing,
  formatAnnualPassRemaining,
} = pricingModule

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

test('el pase anual mantiene precio fijo de $50 MXN', () => {
  const startsAt = Date.parse('2026-05-10T00:00:00-06:00')

  assert.equal(ANNUAL_PASS_PRICE_CENTS, 5000)
  assert.equal(ANNUAL_PASS_REGULAR_PRICE_CENTS, 5000)

  const pricing = buildAnnualPassPricing(startsAt + 6 * DAY_MS, startsAt)

  assert.equal(pricing.phase, 'regular')
  assert.equal(pricing.isPromoActive, false)
  assert.equal(pricing.priceCents, 5000)
  assert.equal(pricing.displayPrice, '$50 MXN')
  assert.equal(pricing.startsAtIso, null)
  assert.equal(pricing.endsAtIso, null)
  assert.equal(pricing.remainingMs, 0)
})

test('el pase anual ignora fechas antiguas de precio temporal', () => {
  const startsAt = Date.parse('2026-05-10T00:00:00-06:00')
  const oneWeekLater = startsAt + 7 * DAY_MS

  const pricing = buildAnnualPassPricing(oneWeekLater, startsAt)

  assert.equal(pricing.phase, 'regular')
  assert.equal(pricing.isPromoActive, false)
  assert.equal(pricing.priceCents, 5000)
  assert.equal(pricing.displayPrice, '$50 MXN')
})

test('el formateo de tiempo conserva días antes de horas, minutos y segundos', () => {
  assert.equal(
    formatAnnualPassRemaining(6 * DAY_MS + 18 * HOUR_MS + 4 * MINUTE_MS + 9 * SECOND_MS),
    '6 días 18 h 04 min 09 s'
  )
  assert.equal(formatAnnualPassRemaining(1 * DAY_MS + 1 * HOUR_MS + 1 * MINUTE_MS + 1 * SECOND_MS), '1 día 01 h 01 min 01 s')
  assert.equal(formatAnnualPassRemaining(3 * HOUR_MS + 2 * MINUTE_MS + 5 * SECOND_MS), '03 h 02 min 05 s')
  assert.equal(formatAnnualPassRemaining(4 * MINUTE_MS + 7 * SECOND_MS), '04 min 07 s')
  assert.equal(formatAnnualPassRemaining(9 * SECOND_MS), '09 s')
})
