'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown, Zap, Check, Loader2, Package } from 'lucide-react'

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTier?: string
}

interface PlanCard {
  id: string
  name: string
  price: string
  period: string
  features: string[]
  priceEnvKey: string
  mode: 'subscription' | 'payment'
  popular?: boolean
  icon: React.ReactNode
}

const plans: PlanCard[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: '$50',
    period: '/mes',
    features: [
      'Descargas ilimitadas',
      'Sin marca de agua',
      '5 upscales por día',
      'Soporte prioritario',
    ],
    priceEnvKey: 'premium',
    mode: 'subscription',
    icon: <Crown className="h-5 w-5" />,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/mes',
    features: [
      'Todo de Premium',
      'Upscales ilimitados*',
      'Prioridad en procesamiento',
      '*Uso justo: 50/día, 500/mes',
    ],
    priceEnvKey: 'pro',
    mode: 'subscription',
    popular: true,
    icon: <Zap className="h-5 w-5" />,
  },
]

interface PackOption {
  id: string
  name: string
  credits: number
  price: string
  priceEnvKey: string
}

const packs: PackOption[] = [
  { id: 'pack_25', name: '25 upscales', credits: 25, price: '$19', priceEnvKey: 'pack_25' },
  { id: 'pack_50', name: '50 upscales', credits: 50, price: '$35', priceEnvKey: 'pack_50' },
  { id: 'pack_200', name: '200 upscales', credits: 200, price: '$99', priceEnvKey: 'pack_200' },
]

export function PricingDialog({ open, onOpenChange, currentTier }: PricingDialogProps) {
  const { data: session } = useSession()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleCheckout = async (priceEnvKey: string, mode: 'subscription' | 'payment') => {
    if (!session) {
      signIn('google')
      return
    }

    setLoadingPlan(priceEnvKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceEnvKey, mode }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Error', { description: data.error })
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Error', { description: 'No se pudo iniciar el pago.' })
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPlan('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Error', { description: 'No se pudo abrir el portal.' })
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Elige tu plan</DialogTitle>
          <DialogDescription className="text-center">
            Desbloquea todas las funciones de PiñataPoster
          </DialogDescription>
        </DialogHeader>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier?.toLowerCase() === plan.id
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all ${
                  plan.popular
                    ? 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                    : 'border-border'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                    Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${plan.popular ? 'bg-purple-500/20 text-purple-500' : 'bg-muted text-muted-foreground'}`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm"> MXN{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === 'manage'}
                  >
                    {loadingPlan === 'manage' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Gestionar suscripción
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${plan.popular ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
                    onClick={() => handleCheckout(plan.priceEnvKey, plan.mode)}
                    disabled={loadingPlan === plan.priceEnvKey}
                  >
                    {loadingPlan === plan.priceEnvKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {session ? 'Suscribirme' : 'Iniciar sesión para suscribirme'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Packs */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Packs de Upscale (compra única)</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {packs.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleCheckout(pack.priceEnvKey, 'payment')}
                disabled={loadingPlan === pack.priceEnvKey}
                className="p-4 rounded-lg border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center disabled:opacity-50"
              >
                {loadingPlan === pack.priceEnvKey ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                ) : (
                  <span className="text-2xl font-bold block">{pack.credits}</span>
                )}
                <span className="text-xs text-muted-foreground block">upscales</span>
                <span className="text-sm font-semibold text-purple-500 mt-1 block">{pack.price} MXN</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Los créditos de packs no expiran y se suman a tu límite del plan.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
