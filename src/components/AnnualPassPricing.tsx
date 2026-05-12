'use client'

import { useAnnualPassPricing } from '@/lib/useAnnualPassPricing'
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
      Pase anual en {pricing.displayPrice}
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
      El pase anual cuesta {pricing.displayPrice} por 12 meses de PiñataPoster ilimitado.
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
      Pase anual: {pricing.displayPrice} · 12 meses ilimitados
    </span>
  )
}

export function AnnualPassCountdownBadge({ className, initialPricing }: AnnualPassPricingTextProps) {
  void className
  void initialPricing
  return null
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
