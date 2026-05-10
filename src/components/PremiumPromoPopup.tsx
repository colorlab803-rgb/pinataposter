'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { isPremiumUser, syncPremiumFromServer } from '@/lib/premium'
import { formatAnnualPassRemaining, useAnnualPassPricing } from '@/lib/useAnnualPassPricing'
import type { AnnualPassPricing } from '@/lib/annual-pass-pricing.shared'
import { Crown, Zap, X, Sparkles, Clock, Infinity, Star } from 'lucide-react'
import { toast } from 'sonner'

function getPromoMessages(pricing: AnnualPassPricing) {
  if (!pricing.isPromoActive) {
    return [
      {
        icon: Crown,
        title: `Pase anual en ${pricing.displayPrice}`,
        text: 'Activa 12 meses de PiñataPoster ilimitado. Gracias por usar PiñataPoster.',
        cta: 'Adquirir pase anual',
      },
      {
        icon: Sparkles,
        title: 'Descarga sin límites',
        text: `El pase anual cuesta ${pricing.displayPrice} e incluye PDF y ZIP ilimitados.`,
        cta: 'Activar premium',
      },
      {
        icon: Infinity,
        title: 'Todo el año activo',
        text: 'Tu pase anual incluye 12 meses ilimitados para descargar tus moldes.',
        cta: `Comprar por ${pricing.displayPrice}`,
      },
    ]
  }

  return [
    {
      icon: Zap,
      title: `Promo Día de las Madres en ${pricing.displayPrice}`,
      text: `Aprovecha tu pase anual durante esta semana. Después costará ${pricing.regularDisplayPrice}.`,
      cta: 'Adquirir pase anual',
    },
    {
      icon: Sparkles,
      title: 'Pase anual con precio especial',
      text: 'El contador está activo. Gracias por usar PiñataPoster.',
      cta: `Aprovechar ${pricing.displayPrice}`,
    },
    {
      icon: Crown,
      title: `12 meses por ${pricing.displayPrice}`,
      text: `Compra antes de que el pase anual suba a ${pricing.regularDisplayPrice}.`,
      cta: 'Obtener pase anual',
    },
    {
      icon: Star,
      title: 'Ahorra antes del cambio',
      text: `Después del contador costará ${pricing.regularDisplayPrice}.`,
      cta: 'Aprovechar ahora',
    },
    {
      icon: Infinity,
      title: 'Aprovecha tu pase anual',
      text: `12 meses ilimitados por ${pricing.displayPrice} durante la promoción.`,
      cta: 'Adquirir pase',
    },
    {
      icon: Clock,
      title: 'Contador activo',
      text: `Compra antes de que termine para conservar el precio de ${pricing.displayPrice}.`,
      cta: `Comprar por ${pricing.displayPrice}`,
    },
  ]
}

function getToastMessages(pricing: AnnualPassPricing) {
  if (!pricing.isPromoActive) {
    return [
      `Pase anual en ${pricing.displayPrice}: 12 meses de PiñataPoster ilimitado`,
      `Activa premium por ${pricing.displayPrice} y descarga moldes sin límites`,
      'Gracias por usar PiñataPoster',
    ]
  }

  return [
    `Promo Día de las Madres: ${pricing.displayPrice} anuales; después ${pricing.regularDisplayPrice}`,
    `Aprovecha tu pase anual: ${pricing.displayPrice} ahora, ${pricing.regularDisplayPrice} después`,
    `El contador está activo para comprar el pase anual en ${pricing.displayPrice}`,
    `12 meses ilimitados por ${pricing.displayPrice}; después ${pricing.regularDisplayPrice}`,
    'Gracias por usar PiñataPoster',
  ]
}

interface PremiumPromoPopupProps {
  onUpgradeClick: () => void
}

export function PremiumPromoPopup({ onUpgradeClick }: PremiumPromoPopupProps) {
  const [visible, setVisible] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const { user, getIdToken, loading: authLoading } = useAuth()
  const { pricing, loading: pricingLoading } = useAnnualPassPricing()
  const promoMessages = useMemo(
    () => getPromoMessages(pricing),
    [pricing.displayPrice, pricing.isPromoActive, pricing.regularDisplayPrice]
  )
  const toastMessages = useMemo(
    () => getToastMessages(pricing),
    [pricing.displayPrice, pricing.isPromoActive, pricing.regularDisplayPrice]
  )

  const checkPremium = useCallback(async () => {
    if (isPremiumUser()) {
      setIsPremium(true)
      return
    }
    if (user) {
      try {
        const token = await getIdToken()
        if (token) {
          const result = await syncPremiumFromServer(token)
          setIsPremium(result)
          return
        }
      } catch {}
    }
    if (user) {
      setIsPremium(false)
    }
  }, [user, getIdToken])

  useEffect(() => {
    if (!authLoading) checkPremium()
  }, [authLoading, checkPremium])

  // Popup flotante: aparece cada 45 segundos
  useEffect(() => {
    if (isPremium !== false || pricingLoading || promoMessages.length === 0) return

    // Primer popup a los 20 segundos
    const firstTimer = setTimeout(() => {
      if (isPremium === false) {
        setMessageIndex(Math.floor(Math.random() * promoMessages.length))
        setVisible(true)
        setDismissed(false)
      }
    }, 20_000)

    // Repetir cada 45 segundos
    const interval = setInterval(() => {
      if (isPremium === false) {
        setMessageIndex(Math.floor(Math.random() * promoMessages.length))
        setVisible(true)
        setDismissed(false)
      }
    }, 45_000)

    return () => {
      clearTimeout(firstTimer)
      clearInterval(interval)
    }
  }, [isPremium, pricingLoading, promoMessages.length])

  // Toast notifications: cada 60 segundos, empezando a los 35s
  useEffect(() => {
    if (isPremium !== false || pricingLoading || toastMessages.length === 0) return

    const firstToast = setTimeout(() => {
      if (isPremium === false) {
        const msg = toastMessages[Math.floor(Math.random() * toastMessages.length)]
        toast(msg, {
          duration: 5000,
          action: {
            label: 'Ver plan',
            onClick: onUpgradeClick,
          },
        })
      }
    }, 35_000)

    const interval = setInterval(() => {
      if (isPremium === false) {
        const msg = toastMessages[Math.floor(Math.random() * toastMessages.length)]
        toast(msg, {
          duration: 5000,
          action: {
            label: 'Ver plan',
            onClick: onUpgradeClick,
          },
        })
      }
    }, 60_000)

    return () => {
      clearTimeout(firstToast)
      clearInterval(interval)
    }
  }, [isPremium, onUpgradeClick, pricingLoading, toastMessages])

  if (isPremium !== false || pricingLoading || !visible || dismissed || promoMessages.length === 0) return null

  const promo = promoMessages[messageIndex % promoMessages.length]
  const Icon = promo.icon

  return (
    <div className="fixed bottom-4 right-4 z-[90] max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
        <div className="relative px-5 py-4">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1 pr-4">
              <h4 className="text-sm font-bold text-white">{promo.title}</h4>
              <p className="text-xs text-purple-200/70 leading-relaxed">{promo.text}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setDismissed(true)
              onUpgradeClick()
            }}
            className="w-full mt-3 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
          >
            {promo.cta}
          </button>
        </div>

        <div className="bg-purple-500/10 px-5 py-2 border-t border-purple-500/20">
          <p className="text-[10px] text-purple-300/40 text-center">
            {pricing.isPromoActive
              ? `Promo Día de las Madres: ${pricing.displayPrice} · Después ${pricing.regularDisplayPrice} · Termina en ${formatAnnualPassRemaining(pricing.remainingMs)}`
              : `Pase anual: ${pricing.displayPrice} · 12 meses ilimitados`}
          </p>
        </div>
      </div>
    </div>
  )
}

// Banner fijo que aparece en la parte superior del generador
export function PremiumBanner({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  const [isPremium, setIsPremium] = useState(true) // default true para no flashear
  const { user, getIdToken, loading: authLoading } = useAuth()
  const { pricing, loading: pricingLoading } = useAnnualPassPricing()

  useEffect(() => {
    if (authLoading) return
    if (isPremiumUser()) { setIsPremium(true); return }

    async function check() {
      if (user) {
        try {
          const token = await getIdToken()
          if (token) {
            const result = await syncPremiumFromServer(token)
            setIsPremium(result)
            return
          }
        } catch {
          setIsPremium(true)
          return
        }
      }
      setIsPremium(false)
    }
    check()
  }, [authLoading, user, getIdToken])

  if (isPremium || pricingLoading) return null

  return (
    <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="h-4 w-4 text-purple-400 shrink-0" />
          <p className="text-xs text-purple-200/80 truncate">
            <span className="hidden sm:inline">
              {pricing.isPromoActive ? 'Promo Día de las Madres · ' : 'Pase anual · '}
            </span>
            <strong className="text-white">
              {pricing.isPromoActive
                ? `${pricing.displayPrice} antes de subir a ${pricing.regularDisplayPrice} · ${formatAnnualPassRemaining(pricing.remainingMs)}`
                : `${pricing.displayPrice} por 12 meses ilimitados`}
            </strong>
          </p>
        </div>
        <button
          onClick={onUpgradeClick}
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 active:scale-95"
        >
          Adquirir pase
        </button>
      </div>
    </div>
  )
}
