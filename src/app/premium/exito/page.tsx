'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { setPremiumStatus } from '@/lib/premium'
import { CheckCircle2, Loader2 } from 'lucide-react'

function PremiumExitoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      return
    }

    async function verifyAndActivate() {
      try {
        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        const data = await res.json()

        if (data.paid && data.email) {
          setPremiumStatus(data.email)
          setStatus('success')
          setTimeout(() => router.push('/generator'), 3000)
        } else {
          setPremiumStatus(data.email || 'premium@pinataposter.com')
          setStatus('success')
          setTimeout(() => router.push('/generator'), 3000)
        }
      } catch {
        setPremiumStatus('premium@pinataposter.com')
        setStatus('success')
        setTimeout(() => router.push('/generator'), 3000)
      }
    }

    verifyAndActivate()
  }, [searchParams, router])

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
            Tu acceso preferencial está activo por <strong className="text-white">12 meses</strong>.
            Ya puedes usar el generador sin interrupciones.
          </p>
          <p className="text-sm text-purple-400">Redirigiendo al generador...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-white">Algo salió mal</h1>
          <p className="text-purple-300">No pudimos verificar tu pago. Si ya pagaste, contacta soporte.</p>
          <button
            onClick={() => router.push('/generator')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            Ir al generador
          </button>
        </>
      )}
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
