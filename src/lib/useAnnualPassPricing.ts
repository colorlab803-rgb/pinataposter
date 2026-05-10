'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildAnnualPassPricing,
  formatAnnualPassRemaining,
  getRegularAnnualPassPricing,
  type AnnualPassPricing,
} from './annual-pass-pricing.shared'

export { formatAnnualPassRemaining }

export function useAnnualPassPricing(initialPricing?: AnnualPassPricing) {
  const [serverPricing, setServerPricing] = useState<AnnualPassPricing | null>(() => initialPricing ?? null)
  const [loading, setLoading] = useState(!initialPricing)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPricing() {
      try {
        const res = await fetch('/api/pricing/annual-pass', { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo consultar el precio anual')

        const data = (await res.json()) as AnnualPassPricing
        if (!cancelled) {
          setServerPricing(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar el precio anual')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPricing()
    const refreshTimer = window.setInterval(loadPricing, 60_000)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
    }
  }, [])

  const pricing = useMemo(() => {
    if (!serverPricing) return getRegularAnnualPassPricing(nowMs)
    return buildAnnualPassPricing(nowMs, serverPricing.startsAt)
  }, [nowMs, serverPricing])

  return { pricing, loading, error }
}
