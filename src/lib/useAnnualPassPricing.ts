'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildAnnualPassPricing,
  getRegularAnnualPassPricing,
  type AnnualPassPricing,
} from './annual-pass-pricing.shared'

export function formatAnnualPassRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

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
