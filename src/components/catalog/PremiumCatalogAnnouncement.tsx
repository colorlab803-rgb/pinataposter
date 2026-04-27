'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Crown, ExternalLink, Sparkles, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  clearCatalogAnnouncementPending,
  hasPendingCatalogAnnouncement,
  hasSeenCatalogAnnouncement,
  markCatalogAnnouncementSeen,
} from '@/lib/premium'

interface PremiumCatalogAnnouncementProps {
  enabled: boolean
  userKey?: string | null
  hasStore?: boolean
  storeSlug?: string | null
  context?: 'dashboard' | 'generator'
}

export function PremiumCatalogAnnouncement({
  enabled,
  userKey,
  hasStore = false,
  storeSlug,
  context = 'dashboard',
}: PremiumCatalogAnnouncementProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!enabled || !userKey) return

    const shouldOpen =
      hasPendingCatalogAnnouncement(userKey) ||
      !hasSeenCatalogAnnouncement(userKey)

    if (shouldOpen) {
      setOpen(true)
    }
  }, [enabled, userKey])

  function finalizeAnnouncement() {
    if (!userKey) return
    clearCatalogAnnouncementPending(userKey)
    markCatalogAnnouncementSeen(userKey)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      finalizeAnnouncement()
    }
  }

  function handlePrimaryAction() {
    finalizeAnnouncement()
    setOpen(false)
    router.push('/dashboard/tienda')
  }

  if (!enabled || !userKey) return null

  const title = hasStore
    ? 'Tu premium ahora también impulsa tu catálogo'
    : 'Tu premium ya incluye catálogo digital'
  const description = hasStore
    ? 'Además de moldes ilimitados, ahora puedes editar y mantener visible tu catálogo digital para tu negocio de piñatas.'
    : 'Además de moldes ilimitados, ahora puedes crear un catálogo digital para mostrar tus piñatas, compartirlo por WhatsApp y recibir pedidos.'
  const primaryLabel = hasStore ? 'Editar mi catálogo' : 'Crear mi catálogo digital'
  const secondaryLabel = context === 'generator' ? 'Seguir en el generador' : 'Lo veo después'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
        <DialogHeader className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30">
              <Crown className="h-6 w-6 text-purple-200" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200">
                Nuevo en premium
              </span>
              <DialogTitle className="text-2xl leading-tight text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-purple-100/75">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Store,
              text: hasStore ? 'Edita la portada, contacto y datos de tu negocio' : 'Crea la portada y datos públicos de tu negocio',
            },
            {
              icon: Sparkles,
              text: 'Publica productos y comparte tu catálogo con clientes',
            },
            {
              icon: Crown,
              text: 'Todo ya viene incluido en tu premium de 12 meses',
            },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-purple-50/85">
              <Icon className="mb-2 h-4 w-4 text-purple-300" />
              {text}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <Button
              onClick={handlePrimaryAction}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
            >
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {hasStore && storeSlug ? (
              <Link href={`/catalogo/${storeSlug}`} target="_blank">
                <Button variant="outline" className="w-full border-gray-700 text-gray-200 hover:text-white sm:w-auto">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver catálogo público
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="text-purple-100/70 hover:bg-white/5 hover:text-white"
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
