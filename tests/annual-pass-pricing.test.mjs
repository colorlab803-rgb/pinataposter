import test from 'node:test'
import assert from 'node:assert/strict'

const pricingModule = await import('../src/lib/annual-pass-pricing.shared.ts')

const {
  ANNUAL_PASS_PROMO_DURATION_MS,
  ANNUAL_PASS_PROMO_PRICE_CENTS,
  ANNUAL_PASS_REGULAR_PRICE_CENTS,
  buildAnnualPassPricing,
} = pricingModule

const DAY_MS = 24 * 60 * 60 * 1000

test('la promoción del Día de las Madres conserva el pase anual en $50 MXN durante una semana', () => {
  const startsAt = Date.parse('2026-05-10T00:00:00-06:00')
  const sixDaysLater = startsAt + 6 * DAY_MS

  assert.equal(ANNUAL_PASS_PROMO_DURATION_MS, 7 * DAY_MS)
  assert.equal(ANNUAL_PASS_PROMO_PRICE_CENTS, 5000)
  assert.equal(ANNUAL_PASS_REGULAR_PRICE_CENTS, 15000)

  const pricing = buildAnnualPassPricing(sixDaysLater, startsAt)

  assert.equal(pricing.phase, 'promo')
  assert.equal(pricing.isPromoActive, true)
  assert.equal(pricing.priceCents, 5000)
  assert.equal(pricing.displayPrice, '$50 MXN')
  assert.equal(pricing.endsAtIso, new Date(startsAt + 7 * DAY_MS).toISOString())
})

test('el pase anual regresa al precio regular cuando termina la semana promocional', () => {
  const startsAt = Date.parse('2026-05-10T00:00:00-06:00')
  const oneWeekLater = startsAt + 7 * DAY_MS

  const pricing = buildAnnualPassPricing(oneWeekLater, startsAt)

  assert.equal(pricing.phase, 'regular')
  assert.equal(pricing.isPromoActive, false)
  assert.equal(pricing.priceCents, 15000)
  assert.equal(pricing.displayPrice, '$150 MXN')
})
