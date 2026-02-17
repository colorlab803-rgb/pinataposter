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
import { Check, Loader2, Package, Sparkles } from 'lucide-react'

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCredits?: number
}

interface PackOption {
  id: string
  name: string
  credits: number
  price: string
  perDesign: string
  priceEnvKey: string
  popular?: boolean
}

const packs: PackOption[] = [
  { id: 'pack_5', name: '5 diseños', credits: 5, price: '$25', perDesign: '$5.00/diseño', priceEnvKey: 'pack_5' },
  { id: 'pack_15', name: '15 diseños', credits: 15, price: '$65', perDesign: '$4.33/diseño', priceEnvKey: 'pack_15', popular: true },
  { id: 'pack_50', name: '50 diseños', credits: 50, price: '$199', perDesign: '$3.98/diseño', priceEnvKey: 'pack_50' },
]

export function PricingDialog({ open, onOpenChange, currentCredits = 0 }: PricingDialogProps) {
  const { data: session } = useSession()
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  const handleCheckout = async (priceEnvKey: string) => {
    if (!session) {
      signIn('google')
      return
    }

    setLoadingPack(priceEnvKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceEnvKey }),
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
      setLoadingPack(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Packs de Diseños</DialogTitle>
          <DialogDescription className="text-center">
            Compra créditos para descargar sin marca de agua y con upscale incluido
          </DialogDescription>
        </DialogHeader>

        {/* Créditos actuales */}
        {session && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-muted/50 rounded-lg mx-auto">
            <Package className="h-4 w-4 text-purple-500" />
            <span className="text-sm">
              Tienes <strong className="text-purple-500">{currentCredits}</strong> crédito{currentCredits !== 1 ? 's' : ''} disponible{currentCredits !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Comparación Gratis vs Pack */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-lg border p-4">
            <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Gratis</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• 1 diseño por día</li>
              <li>• Con marca de agua</li>
              <li>• Sin mejora de calidad</li>
            </ul>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
            <h4 className="font-semibold text-sm mb-2 text-purple-500 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Con créditos
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                Sin marca de agua
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                Mejora de calidad (upscale)
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                No expiran
              </li>
            </ul>
          </div>
        </div>

        {/* Packs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-xl border-2 p-5 text-center transition-all hover:shadow-md ${
                pack.popular
                  ? 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                  : 'border-border'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                  Más popular
                </div>
              )}

              <div className="text-3xl font-bold mt-1">{pack.credits}</div>
              <div className="text-sm text-muted-foreground mb-3">diseños</div>

              <div className="text-2xl font-bold">{pack.price}</div>
              <div className="text-xs text-muted-foreground mb-1">MXN</div>
              <div className="text-xs text-purple-500 font-medium mb-4">{pack.perDesign}</div>

              <Button
                className={`w-full ${pack.popular ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
                onClick={() => handleCheckout(pack.priceEnvKey)}
                disabled={loadingPack === pack.priceEnvKey}
              >
                {loadingPack === pack.priceEnvKey ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {session ? 'Comprar' : 'Iniciar sesión'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Los créditos no expiran. Cada crédito = 1 descarga sin marca de agua + 1 mejora de calidad.
        </p>
      </DialogContent>
    </Dialog>
  )
}
