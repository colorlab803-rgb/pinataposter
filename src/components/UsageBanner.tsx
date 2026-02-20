'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Package, Clock, Sparkles, Eye, EyeOff, Wand2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UsageData {
  loggedIn: boolean
  designCredits: number
  hasCredits: boolean
  watermark: boolean
  freeDownloadsUsed: number
  freeDownloadsLimit: number
  freeDownloadsResetAt: number | null
  planLabel: 'anonymous' | 'free' | 'credits'
}

interface UsageBannerProps {
  onOpenPricing?: () => void
  onSignIn?: () => void
  onUsageUpdate?: (data: UsageData) => void
}

export function UsageBanner({ onOpenPricing, onSignIn, onUsageUpdate }: UsageBannerProps) {
  const { data: session } = useSession()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/user', { cache: 'no-store' })
      const data: UsageData = await res.json()
      setUsage(data)
      onUsageUpdate?.(data)
    } catch {
      // silently fail
    }
  }, [onUsageUpdate])

  useEffect(() => {
    fetchUsage()
  }, [session, fetchUsage])

  // Refetch every 60s to keep data fresh
  useEffect(() => {
    const interval = setInterval(fetchUsage, 60000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  // Countdown timer for free reset
  useEffect(() => {
    if (!usage?.freeDownloadsResetAt) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const now = Date.now()
      const diff = usage.freeDownloadsResetAt! - now
      if (diff <= 0) {
        setCountdown(null)
        fetchUsage()
        return
      }
      const hours = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setCountdown(`${hours}h ${mins}m`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [usage?.freeDownloadsResetAt, fetchUsage])

  if (!usage) return null

  // Anonymous user
  if (!usage.loggedIn) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Modo visitante</p>
              <p className="text-xs text-purple-300/70">Inicia sesión para tu diseño gratis diario</p>
            </div>
          </div>
          {onSignIn && (
            <Button size="sm" variant="ghost" onClick={onSignIn} className="text-purple-300 hover:text-white flex-shrink-0">
              <LogIn className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Logged in user with credits
  if (usage.planLabel === 'credits') {
    return (
      <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm p-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {usage.designCredits} crédito{usage.designCredits !== 1 ? 's' : ''} disponible{usage.designCredits !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-purple-300/70">
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Sin marca de agua
                </span>
                <span className="flex items-center gap-1">
                  <Wand2 className="h-3 w-3" /> Mejora AI incluida
                </span>
              </div>
            </div>
          </div>
          {usage.designCredits <= 3 && onOpenPricing && (
            <Button size="sm" variant="ghost" onClick={onOpenPricing} className="text-purple-300 hover:text-white flex-shrink-0 text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Recargar
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Free registered user
  const freeRemaining = usage.freeDownloadsLimit - usage.freeDownloadsUsed
  const hasUsedFreeToday = freeRemaining <= 0

  return (
    <div className={`rounded-lg border backdrop-blur-sm p-3 mb-4 transition-colors ${
      hasUsedFreeToday
        ? 'border-amber-500/30 bg-amber-500/10'
        : 'border-green-500/30 bg-green-500/10'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            hasUsedFreeToday ? 'bg-amber-500/20' : 'bg-green-500/20'
          }`}>
            {hasUsedFreeToday ? (
              <Clock className="h-4 w-4 text-amber-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-green-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">
                {hasUsedFreeToday
                  ? 'Diseño gratis agotado'
                  : `${freeRemaining} diseño gratis disponible`
                }
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-purple-300/70">
              {hasUsedFreeToday && countdown ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Se renueva en {countdown}
                </span>
              ) : hasUsedFreeToday ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Se renueva mañana
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> Incluye marca de agua
              </span>
              {!hasUsedFreeToday && (
                <span className="flex items-center gap-1">
                  <Wand2 className="h-3 w-3" /> 1 mejora AI incluida
                </span>
              )}
            </div>
          </div>
        </div>
        {onOpenPricing && (
          <Button size="sm" variant="ghost" onClick={onOpenPricing} className="text-purple-300 hover:text-white flex-shrink-0 text-xs">
            <Package className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Sin marca de agua</span>
            <span className="sm:hidden">Pack</span>
          </Button>
        )}
      </div>
    </div>
  )
}
