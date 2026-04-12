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
import { Heart, Copy, Check } from 'lucide-react'

const DONATION_KEY = 'pinataposter_donation_seen'

const accounts = [
  {
    label: 'Transferencia nacional (México)',
    value: '646990404071880785',
  },
  {
    label: 'Transferencia internacional',
    value: '170002404071880783',
  },
  {
    label: 'Código BIC / SWIFT',
    value: 'REVOMXM2',
  },
]

export function DonationModal() {
  const [open, setOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    const seen = localStorage.getItem(DONATION_KEY)
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 2000)
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
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            Ayúdanos a seguir siendo gratis
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            PiñataPoster es y será gratuito. Si te ha sido útil, considera hacer una donación para que podamos mejorar y agregar nuevas funciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {accounts.map((account, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 border"
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{account.label}</p>
                <p className="text-sm font-mono font-medium truncate">{account.value}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => handleCopy(account.value, i)}
              >
                {copiedIndex === i ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground pt-1">
          ¡Cada aportación cuenta! Gracias por apoyar a la comunidad piñatera 🪅
        </p>

        <div className="flex justify-center pt-2">
          <Button onClick={handleClose} className="gap-2">
            <Heart className="h-4 w-4" />
            ¡Gracias, continuar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
