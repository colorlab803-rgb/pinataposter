'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heart, Copy, Check, Coffee, Sparkles, ArrowRight } from 'lucide-react'

const DONATION_KEY = 'pinataposter_donation_seen'

type ModalStep = 'gratitude' | 'support'

const accounts = [
  {
    label: 'Transferencia nacional (México)',
    value: '646990404071880785',
    emoji: '🇲🇽',
  },
  {
    label: 'Transferencia internacional',
    value: '170002404071880783',
    emoji: '🌎',
  },
  {
    label: 'Código BIC / SWIFT',
    value: 'REVOMXM2',
    emoji: '🏦',
  },
]

const futureFeatures = [
  'Más tamaños de papel y formatos',
  'Generador de moldes con IA',
  'Biblioteca de plantillas premium',
]

export function DonationModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>('gratitude')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    const seen = localStorage.getItem(DONATION_KEY)
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 2500)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  function handleCopy(value: string, index: number) {
    navigator.clipboard.writeText(value)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  function handleClose() {
    localStorage.setItem(DONATION_KEY, 'true')
    setOpen(false)
    setStep('gratitude')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {step === 'gratitude' && (
          <>
            {/* Decorative gradient glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <DialogHeader className="relative">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
                  <span className="text-3xl">🪅</span>
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                ¡Gracias por usar PiñataPoster!
              </DialogTitle>
              <DialogDescription className="text-center text-sm leading-relaxed pt-2">
                Esta herramienta fue creada con mucho cariño para que cualquier piñatero 
                pueda imprimir sus moldes <strong className="text-foreground">fácilmente y sin complicaciones</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <p className="text-sm text-center text-muted-foreground">
                Mantener PiñataPoster funcionando tiene un costo real: servidores, desarrollo y 
                muchas horas de trabajo. <span className="text-foreground font-medium">Con tu apoyo, podemos seguir mejorando:</span>
              </p>

              <div className="space-y-2">
                {futureFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => setStep('support')}
                  className="w-full gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 h-12 text-base shadow-lg shadow-purple-500/20"
                >
                  <Coffee className="h-4 w-4" />
                  Quiero apoyar
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="w-full text-muted-foreground hover:text-foreground text-sm"
                >
                  Ahora no, tal vez después
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'support' && (
          <>
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <DialogHeader className="relative">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-red-400 fill-red-400 animate-pulse" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                ¡Eres increíble! 🎉
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Cualquier monto ayuda. Incluso lo que cuesta un cafecito ☕ hace la diferencia 
                para que miles de piñateros sigan disfrutando esta herramienta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 pt-3">
              {accounts.map((account, i) => (
                <button
                  key={i}
                  onClick={() => handleCopy(account.value, i)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border hover:bg-muted/80 hover:border-purple-500/30 transition-all group text-left"
                >
                  <span className="text-xl shrink-0">{account.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{account.label}</p>
                    <p className="text-sm font-mono font-medium truncate">{account.value}</p>
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    {copiedIndex === i ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center pt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Toca cualquier cuenta para copiarla · No se necesita monto mínimo
              </p>
              <Button onClick={handleClose} variant="outline" className="gap-2">
                <Heart className="h-4 w-4 text-red-400" />
                ¡Listo, gracias!
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
