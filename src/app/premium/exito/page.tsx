'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { markCatalogAnnouncementPending, setPremiumStatus } from '@/lib/premium'
import { useAuth } from '@/components/AuthProvider'
import { CheckCircle2, Loader2, Clock, Store } from 'lucide-react'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'
import { PaymentSupportNotice } from '@/components/PaymentSupportNotice'

function PremiumExitoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, getIdToken } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'pending_oxxo' | 'error'>('loading')

  useEffect(() => {
    if (authLoading) return

    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      return
    }

    async function verifyAndActivate() {
      try {
        const headers: Record<string, string> = {}
        if (user) {
          const token = await getIdToken()
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
        }

        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`, { headers })
        const data = await res.json()

        if (data.paid) {
          // Pago completado (tarjeta) — activar inmediatamente
          setPremiumStatus(data.email || user?.email || 'premium@pinataposter.com')
          const premiumUserKey = data.uid || user?.uid
          if (DIGITAL_CATALOG_ENABLED && premiumUserKey) {
            markCatalogAnnouncementPending(premiumUserKey)
          }
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 2800)
        } else if (data.paymentStatus === 'unpaid') {
          // OXXO — pago pendiente
          setStatus('pending_oxxo')
        } else {
          // Pago no completado — mostrar error
          setStatus('error')
        }
      } catch {
        // Error de red/API — no activar premium, mostrar error
        setStatus('error')
      }
    }

    verifyAndActivate()
  }, [searchParams, router, user, authLoading, getIdToken])

  return (
    <div className="max-w-md w-full text-center space-y-6">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 text-purple-400 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold text-white">Activando tu acceso...</h1>
          <p className="text-purple-300">Verificando tu pago con Stripe</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">¡Acceso activado! 🎉</h1>
          <p className="text-purple-300">
            Tu pago anual activó <strong className="text-white">12 meses</strong> de PiñataPoster ilimitado.
            Ya puedes crear todos los moldes que necesites para tu negocio de piñatas.
          </p>
          <p className="text-sm text-purple-400">Redirigiendo a tu dashboard...</p>
        </>
      )}

      {status === 'pending_oxxo' && (
        <>
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
            <Store className="h-12 w-12 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">¡Casi listo! 🏪</h1>
          <p className="text-purple-300">
            Tu voucher de OXXO ha sido generado. Realiza el pago en cualquier sucursal OXXO y tu acceso se activará automáticamente.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-300">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Pago pendiente</span>
            </div>
            <p className="text-xs text-amber-300/70">
              Tienes hasta 3 días para realizar el pago. Una vez confirmado, podrás usar el generador sin límites.
            </p>
          </div>
          <button
            onClick={() => router.push('/generator')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            Volver al generador
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-white">Algo salió mal</h1>
          <p className="text-purple-300">No pudimos verificar tu pago automáticamente. Si ya realizaste tu pago, repórtalo en el formulario de abajo y activaremos tu acceso manualmente.</p>
          <button
            onClick={() => router.push('/generator')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            Ir al generador
          </button>
        </>
      )}

      {status !== 'loading' && <PaymentSupportNotice />}
    </div>
  )
}

export default function PremiumExitoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-purple-400 animate-spin mx-auto" />
            <p className="text-purple-300 mt-4">Cargando...</p>
          </div>
        }
      >
        <PremiumExitoContent />
      </Suspense>
    </div>
  )
}
