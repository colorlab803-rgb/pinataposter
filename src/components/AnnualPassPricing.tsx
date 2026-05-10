'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAnnualPassRemaining, useAnnualPassPricing } from '@/lib/useAnnualPassPricing'
import type { AnnualPassPricing } from '@/lib/annual-pass-pricing.shared'

interface AnnualPassPricingTextProps {
  className?: string
  initialPricing?: AnnualPassPricing
}

export function AnnualPassHeadline({ className, initialPricing }: AnnualPassPricingTextProps) {
  const { pricing, loading } = useAnnualPassPricing(initialPricing)

  if (loading) {
    return <span className={className}>Consultando precio anual</span>
  }

  return (
    <span className={className}>
      {pricing.isPromoActive
        ? `Promo Día de las Madres en ${pricing.displayPrice}`
        : `Pase anual en ${pricing.displayPrice}`}
    </span>
  )
}

export function AnnualPassPromoText({ className, initialPricing }: AnnualPassPricingTextProps) {
  const { pricing, loading } = useAnnualPassPricing(initialPricing)

  if (loading) {
    return <span className={className}>Consultando precio anual del pase.</span>
  }

  return (
    <span className={className}>
      {pricing.isPromoActive
        ? `Promoción Día de las Madres: pase anual en ${pricing.displayPrice} durante esta semana; después costará ${pricing.regularDisplayPrice}. Gracias por usar PiñataPoster.`
        : `El pase anual cuesta ${pricing.displayPrice}. Gracias por usar PiñataPoster.`}
    </span>
  )
}

export function AnnualPassCompactLine({ className, initialPricing }: AnnualPassPricingTextProps) {
  const { pricing, loading } = useAnnualPassPricing(initialPricing)

  if (loading) {
    return <span className={className}>Consultando precio anual</span>
  }

  return (
    <span className={className}>
      {pricing.isPromoActive
        ? `Promo Día de las Madres: ${pricing.displayPrice} · Después ${pricing.regularDisplayPrice} · Termina en ${formatAnnualPassRemaining(pricing.remainingMs)}`
        : `Pase anual: ${pricing.displayPrice} · 12 meses ilimitados`}
    </span>
  )
}

export function AnnualPassCountdownBadge({ className, initialPricing }: AnnualPassPricingTextProps) {
  const { pricing, loading } = useAnnualPassPricing(initialPricing)

  if (loading || !pricing.isPromoActive) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200',
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      Termina en {formatAnnualPassRemaining(pricing.remainingMs)}
    </span>
  )
}

export function AnnualPassCtaText({ className, initialPricing }: AnnualPassPricingTextProps) {
  const { pricing, loading } = useAnnualPassPricing(initialPricing)

  return (
    <span className={className}>
      {loading ? 'Consultando precio...' : `Adquirir pase anual por ${pricing.displayPrice}`}
    </span>
  )
}

export function AnnualPassPriceText({ className, initialPricing }: AnnualPassPricingTextProps) {
  const { pricing, loading } = useAnnualPassPricing(initialPricing)

  return (
    <span className={className}>
      {loading ? 'consultando precio' : pricing.displayPrice}
    </span>
  )
}
