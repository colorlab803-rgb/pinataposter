'use client'

import { useState, useEffect } from 'react'
import { Zap, Shield, Clock, Loader2, AlertTriangle } from 'lucide-react'
import { shouldShowDemandBanner } from '@/lib/demandSchedule'
import { isPremiumUser } from '@/lib/premium'

export function HighDemandGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isPremiumUser()) {
      setShowGate(false)
      return
    }
    setShowGate(shouldShowDemandBanner())

    // Re-evaluar cada minuto (para cambios de hora)
    const interval = setInterval(() => {
      if (isPremiumUser()) {
        setShowGate(false)
        return
      }
      setShowGate(shouldShowDemandBanner())
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL de checkout')
      }
    } catch (error) {
      console.error('Error al iniciar checkout:', error)
      setLoading(false)
    }
  }

  // Antes del montaje, mostrar children para evitar flash
  if (!mounted) return <>{children}</>

  if (!showGate) return <>{children}</>

  return (
    <>
      {/* Contenido del generador desenfocado detrás */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="blur-sm opacity-30">
          {children}
        </div>
      </div>

      {/* Overlay bloqueante */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <div className="max-w-lg w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20 border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Alta demanda en el servidor</h2>
                <p className="text-xs text-amber-300/70">Sistema de uso justo activado</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-5 space-y-5">
            <p className="text-sm text-purple-200/80 leading-relaxed">
              Debido al crecimiento de usuarios, hemos implementado un <strong className="text-white">sistema de uso justo</strong> para 
              garantizar la disponibilidad del servicio. El generador de moldes tiene acceso limitado en horarios de alta demanda.
            </p>

            {/* Beneficios del acceso preferencial */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                Acceso Preferencial
              </h3>
              <div className="grid gap-2">
                {[
                  { icon: Zap, text: 'Acceso ilimitado al generador, sin esperas' },
                  { icon: Clock, text: 'Válido por 12 meses completos' },
                  { icon: Shield, text: 'Prioridad en horarios de alta demanda' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-purple-200/70">
                    <Icon className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Precio y CTA */}
            <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl border border-purple-500/20 p-4 text-center space-y-3">
              <div>
                <span className="text-3xl font-bold text-white">$169</span>
                <span className="text-lg text-purple-300 ml-1">MXN</span>
              </div>
              <p className="text-xs text-purple-300/60">
                Pago único · Se activa inmediatamente · 12 meses de acceso
              </p>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirigiendo a Stripe...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Obtener Acceso Preferencial
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-purple-300/40">
              Pago seguro procesado por Stripe · No almacenamos datos de tarjeta
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
