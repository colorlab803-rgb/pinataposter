'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { formatAnnualPassRemaining, useAnnualPassPricing } from '@/lib/useAnnualPassPricing'
import { Zap, Shield, Clock, Loader2, Store, Crown, X } from 'lucide-react'
import { toast } from 'sonner'

interface PremiumUpgradeModalProps {
  open: boolean
  onClose: () => void
  redirectTo?: string
}

export function PremiumUpgradeModal({
  open,
  onClose,
  redirectTo = '/generator',
}: PremiumUpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, getIdToken } = useAuth()
  const { pricing, loading: pricingLoading } = useAnnualPassPricing()
  const priceLabel = pricingLoading ? '...' : `$${Math.round(pricing.priceCents / 100)}`

  async function handleCheckout() {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }

    setLoading(true)
    try {
      const idToken = await getIdToken()
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'No se recibió URL de checkout')
      }
    } catch (error) {
      console.error('Error al iniciar checkout:', error)
      toast.error('Error al conectar con el sistema de pago. Intenta de nuevo.')
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div className="max-w-lg w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {pricingLoading
                  ? 'Consultando precio anual'
                  : pricing.isPromoActive
                  ? `Promo Día de las Madres en ${pricing.displayPrice}`
                  : `Pase anual en ${pricing.displayPrice}`}
              </h2>
              <p className="text-xs text-purple-300/70">
                {pricingLoading
                  ? 'Confirmando el precio vigente'
                  : pricing.isPromoActive
                  ? `Después costará ${pricing.regularDisplayPrice}`
                  : '12 meses de PiñataPoster ilimitado'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-purple-200/80 leading-relaxed">
            {pricingLoading ? (
              'Consultando el precio vigente del pase anual.'
            ) : pricing.isPromoActive ? (
              <>
                Aprovecha la promoción del Día de las Madres y adquiere tu <strong className="text-white">pase anual</strong> por {pricing.displayPrice} durante esta semana.
                Después costará {pricing.regularDisplayPrice}. Gracias por usar PiñataPoster.
              </>
            ) : (
              <>
                Activa tu <strong className="text-white">pase anual</strong> por {pricing.displayPrice}.
                Incluye 12 meses ilimitados para descargar todos los moldes que necesites.
              </>
            )}
          </p>

          {!pricingLoading && pricing.isPromoActive && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              El precio especial termina en {formatAnnualPassRemaining(pricing.remainingMs)}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              Pase anual
            </h3>
            <div className="grid gap-2">
              {[
                { icon: Zap, text: 'PiñataPoster ilimitado durante 12 meses' },
                {
                  icon: Clock,
                  text: pricingLoading
                    ? 'Precio anual vigente confirmado antes de pagar'
                    : pricing.isPromoActive
                    ? `Semana promocional Día de las Madres con precio anual de ${pricing.displayPrice}`
                    : `Precio anual vigente de ${pricing.displayPrice}`,
                },
                {
                  icon: Crown,
                  text: pricingLoading
                    ? 'El pase anual se activa al completar el pago'
                    : pricing.isPromoActive
                    ? `Después el pase anual costará ${pricing.regularDisplayPrice}`
                    : 'El pase anual mantiene 12 meses de acceso ilimitado',
                },
                { icon: Shield, text: 'Descarga PDF y ZIP sin límites mientras tu acceso esté activo' },
                { icon: Store, text: 'Paga con tarjeta o en efectivo en OXXO' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-purple-200/70">
                  <Icon className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl border border-purple-500/20 p-4 text-center space-y-3">
            <div>
              <span className="text-3xl font-bold text-white">{priceLabel}</span>
              <span className="text-lg text-purple-300 ml-1">MXN</span>
            </div>
            <p className="text-xs text-purple-300/60">
              {pricingLoading
                ? 'Confirmando precio vigente'
                : pricing.isPromoActive
                ? `Promo Día de las Madres · Después ${pricing.regularDisplayPrice} · 12 meses de acceso ilimitado`
                : 'Se activa inmediatamente · 12 meses de acceso ilimitado'}
            </p>
            <button
              onClick={handleCheckout}
              disabled={loading || pricingLoading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading || pricingLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {loading ? 'Redirigiendo a Stripe...' : 'Consultando precio...'}
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Adquirir pase anual por {pricing.displayPrice}
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-sm text-purple-300/60 hover:text-purple-200 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            Seguir editando sin descargar
          </button>

          <p className="text-[11px] text-center text-purple-300/40">
            Pago seguro procesado por Stripe · Acepta tarjeta y OXXO
          </p>

        </div>
      </div>
    </div>
  )
}
