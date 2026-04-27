'use client'

import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { CatalogPremiumPaywall } from './CatalogPremiumPaywall'
import { useCatalogAccess } from '@/lib/useCatalogAccess'

interface CatalogPremiumGuardProps {
  children: ReactNode
  storeSlug?: string | null
}

export function CatalogPremiumGuard({
  children,
  storeSlug,
}: CatalogPremiumGuardProps) {
  const { loading, catalogAccess } = useCatalogAccess()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (catalogAccess.status !== 'premium') {
    return <CatalogPremiumPaywall catalogAccess={catalogAccess} storeSlug={storeSlug} />
  }

  return <>{children}</>
}
