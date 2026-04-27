'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Crown, ExternalLink, Lock, Sparkles, Store, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal'
import type { CatalogAccess } from '@/lib/types/catalog-access'

interface CatalogPremiumPaywallProps {
  catalogAccess: CatalogAccess
  storeSlug?: string | null
}

function formatDate(value: number | null): string | null {
  if (!value) return null
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function CatalogPremiumPaywall({
  catalogAccess,
  storeSlug,
}: CatalogPremiumPaywallProps) {
  const [open, setOpen] = useState(false)

  const graceEndsAtLabel = useMemo(
    () => formatDate(catalogAccess.graceEndsAt),
    [catalogAccess.graceEndsAt]
  )

  const isGrace = catalogAccess.status === 'grace'
  const hasPublicCatalog = isGrace && Boolean(storeSlug)
  const title = hasPublicCatalog
    ? 'Tu catálogo sigue activo por tiempo limitado'
    : isGrace
    ? 'Tu periodo de gracia premium está activo'
    : 'El catálogo digital ahora es exclusivo para premium'
  const description = hasPublicCatalog
    ? 'Mantén publicado tu catálogo y recupera la edición completa antes de que termine la gracia.'
    : isGrace
    ? 'Reactiva premium para volver a administrar tu catálogo y conservar todos los beneficios.'
    : 'Activa premium para publicar tu emprendimiento, editar productos y mantener tu catálogo visible.'

  return (
    <>
      <Card className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-purple-950/80 border-amber-500/20 shadow-xl shadow-amber-500/5">
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-3 ${isGrace ? 'bg-amber-500/15' : 'bg-purple-500/15'}`}>
              {isGrace ? (
                <AlertTriangle className="h-6 w-6 text-amber-300" />
              ) : (
                <Lock className="h-6 w-6 text-purple-300" />
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl text-white">{title}</CardTitle>
              <p className="text-sm text-gray-300">{description}</p>
            </div>
          </div>

          {isGrace && graceEndsAtLabel && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {hasPublicCatalog
                ? <>Tu catálogo público seguirá disponible hasta el <strong>{graceEndsAtLabel}</strong>. Mientras tanto, el dashboard queda en solo lectura.</>
                : <>Tu periodo de gracia termina el <strong>{graceEndsAtLabel}</strong>. Reactiva premium para volver a administrar tu catálogo sin interrupciones.</>}
            </div>
          )}

          {!isGrace && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
              Premium desbloquea moldes ilimitados y el catálogo digital de tu emprendimiento por un solo pago anual.
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Store, text: 'Publica tu catálogo digital sin costo extra' },
              { icon: Sparkles, text: 'Agrega y edita productos cuando lo necesites' },
              { icon: Zap, text: 'Mantén moldes ilimitados durante 12 meses' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                <Icon className="h-4 w-4 text-purple-300 mb-2" />
                {text}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              Activar premium por $50 MXN
            </Button>

            {storeSlug && isGrace && (
              <Link href={`/catalogo/${storeSlug}`} target="_blank">
                <Button variant="outline" className="border-gray-700 text-gray-200 hover:text-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver catálogo público
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <PremiumUpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        redirectTo="/dashboard"
      />
    </>
  )
}
