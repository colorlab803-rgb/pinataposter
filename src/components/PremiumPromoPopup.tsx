'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { isPremiumUser, syncPremiumFromServer } from '@/lib/premium'
import { Crown, Zap, X, Sparkles, Clock, Infinity, Star } from 'lucide-react'
import { toast } from 'sonner'

const PROMO_MESSAGES = [
  {
    icon: Zap,
    title: '¡Moldes ilimitados!',
    text: 'Por solo $50 MXN al año, crea todos los moldes que necesites sin límite diario.',
    cta: 'Desbloquear ahora',
  },
  {
    icon: Sparkles,
    title: '¿Necesitas más moldes hoy?',
    text: 'Usuarios premium crean moldes ilimitados. ¡Solo $50 pesos por todo un año!',
    cta: 'Quiero acceso ilimitado',
  },
  {
    icon: Crown,
    title: 'Sé premium por menos de $5/mes',
    text: '$50 MXN dividido en 12 meses = ¡menos de $5 al mes! Moldes ilimitados todo el año.',
    cta: 'Activar premium',
  },
  {
    icon: Star,
    title: '⭐ Oferta especial',
    text: 'Acceso ilimitado al generador por un año completo. Sin esperas, sin límites.',
    cta: 'Aprovechar por $50 MXN',
  },
  {
    icon: Infinity,
    title: 'Sin límites, sin preocupaciones',
    text: 'Piñateros profesionales necesitan herramientas sin restricciones. Hazte premium hoy.',
    cta: 'Obtener acceso ilimitado',
  },
  {
    icon: Clock,
    title: '¿Volverás mañana por otro molde?',
    text: 'O desbloquea moldes ilimitados ahora mismo por solo $50 MXN al año.',
    cta: 'Desbloquear todo',
  },
]

// Toasts persuasivos que aparecen cada cierto tiempo
const TOAST_MESSAGES = [
  '💡 ¿Sabías que por $50 MXN tienes moldes ilimitados por un año?',
  '🪅 Los piñateros más productivos usan el plan ilimitado',
  '⚡ Ahorra tiempo: crea todos los moldes que necesites de una vez',
  '🔥 El plan ilimitado cuesta menos que una piñata pequeña',
  '👑 Únete a los piñateros premium — $50 MXN por 12 meses',
  '📐 ¿Muchos diseños en mente? Con premium los haces todos hoy',
  '💰 Menos de $5 al mes por moldes ilimitados',
  '🎯 Tu próximo molde podría ser el que más vendas — no esperes a mañana',
]

interface PremiumPromoPopupProps {
  onUpgradeClick: () => void
}

export function PremiumPromoPopup({ onUpgradeClick }: PremiumPromoPopupProps) {
  const [visible, setVisible] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { user, getIdToken, loading: authLoading } = useAuth()

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
          if (result) {
            setIsPremium(true)
            return
          }
        }
      } catch {}
    }
    setIsPremium(false)
  }, [user, getIdToken])

  useEffect(() => {
    if (!authLoading) checkPremium()
  }, [authLoading, checkPremium])

  // Popup flotante: aparece cada 45 segundos
  useEffect(() => {
    if (isPremium) return

    // Primer popup a los 20 segundos
    const firstTimer = setTimeout(() => {
      if (!isPremium) {
        setMessageIndex(Math.floor(Math.random() * PROMO_MESSAGES.length))
        setVisible(true)
        setDismissed(false)
      }
    }, 20_000)

    // Repetir cada 45 segundos
    const interval = setInterval(() => {
      if (!isPremium) {
        setMessageIndex(Math.floor(Math.random() * PROMO_MESSAGES.length))
        setVisible(true)
        setDismissed(false)
      }
    }, 45_000)

    return () => {
      clearTimeout(firstTimer)
      clearInterval(interval)
    }
  }, [isPremium])

  // Toast notifications: cada 60 segundos, empezando a los 35s
  useEffect(() => {
    if (isPremium) return

    const firstToast = setTimeout(() => {
      if (!isPremium) {
        const msg = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)]
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
      if (!isPremium) {
        const msg = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)]
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
  }, [isPremium, onUpgradeClick])

  if (isPremium || !visible || dismissed) return null

  const promo = PROMO_MESSAGES[messageIndex]
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
            Pago único de $50 MXN · Tarjeta o OXXO · 12 meses
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
        } catch {}
      }
      setIsPremium(false)
    }
    check()
  }, [authLoading, user, getIdToken])

  if (isPremium) return null

  return (
    <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="h-4 w-4 text-purple-400 shrink-0" />
          <p className="text-xs text-purple-200/80 truncate">
            <span className="hidden sm:inline">Desbloquea todo el potencial · </span>
            <strong className="text-white">Moldes ilimitados por $50 MXN/año</strong>
          </p>
        </div>
        <button
          onClick={onUpgradeClick}
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 active:scale-95"
        >
          Desbloquear
        </button>
      </div>
    </div>
  )
}
