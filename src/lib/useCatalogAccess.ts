'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { checkPremiumServer, type PremiumStatusResponse } from './premium'
import { LOCKED_CATALOG_ACCESS, type CatalogAccess } from './types/catalog-access'

interface CatalogAccessState {
  loading: boolean
  premium: boolean
  catalogAccess: CatalogAccess
  paymentMethod: PremiumStatusResponse['paymentMethod']
  expiresAt: number | null
  refresh: () => Promise<void>
}

export function useCatalogAccess(): CatalogAccessState {
  const { user, loading: authLoading, getIdToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [premium, setPremium] = useState(false)
  const [catalogAccess, setCatalogAccess] = useState<CatalogAccess>(LOCKED_CATALOG_ACCESS)
  const [paymentMethod, setPaymentMethod] = useState<PremiumStatusResponse['paymentMethod']>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    if (authLoading) return

    if (!user) {
      setPremium(false)
      setCatalogAccess(LOCKED_CATALOG_ACCESS)
      setPaymentMethod(null)
      setExpiresAt(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const token = await getIdToken()
      if (!token) {
        setPremium(false)
        setCatalogAccess(LOCKED_CATALOG_ACCESS)
        setPaymentMethod(null)
        setExpiresAt(null)
        return
      }

      const result = await checkPremiumServer(token)
      setPremium(Boolean(result.premium))
      setCatalogAccess(result.catalogAccess || LOCKED_CATALOG_ACCESS)
      setPaymentMethod(result.paymentMethod || null)
      setExpiresAt(result.expiresAt || null)
    } catch {
      setPremium(false)
      setCatalogAccess(LOCKED_CATALOG_ACCESS)
      setPaymentMethod(null)
      setExpiresAt(null)
    } finally {
      setLoading(false)
    }
  }, [authLoading, getIdToken, user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    loading,
    premium,
    catalogAccess,
    paymentMethod,
    expiresAt,
    refresh,
  }
}
