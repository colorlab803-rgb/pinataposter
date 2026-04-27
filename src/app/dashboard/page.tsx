'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, Package, ExternalLink, Plus, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import type { Store as StoreType } from '@/lib/types/catalog'
import { useCatalogAccess } from '@/lib/useCatalogAccess'
import { CatalogPremiumPaywall } from '@/components/catalog/CatalogPremiumPaywall'
import { PremiumCatalogAnnouncement } from '@/components/catalog/PremiumCatalogAnnouncement'

export default function DashboardPage() {
  const { user, getIdToken } = useAuth()
  const { loading: accessLoading, catalogAccess } = useCatalogAccess()
  const [store, setStore] = useState<StoreType | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const token = await getIdToken()
      if (!token) return

      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch('/api/stores', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (storeRes.ok) {
          const storeData = await storeRes.json()
          if (storeData.store) setStore(storeData.store)
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProductCount(productsData.products?.length || 0)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [getIdToken])

  const canManageCatalog = catalogAccess.status === 'premium'
  const canViewPublicCatalog = catalogAccess.status === 'premium' || catalogAccess.status === 'grace'
  const showCatalogLaunchCta = canManageCatalog && !store

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          ¡Hola, {user?.displayName || 'Piñatero'}! 🪅
        </h1>
        <p className="text-gray-400 mt-1">
          {canManageCatalog
            ? 'Administra tu catálogo digital de piñatas'
            : 'Premium desbloquea tu catálogo digital y moldes ilimitados'}
        </p>
      </div>

      {!canManageCatalog && (
        <CatalogPremiumPaywall catalogAccess={catalogAccess} storeSlug={store?.slug} />
      )}

      <PremiumCatalogAnnouncement
        enabled={canManageCatalog}
        userKey={user?.uid}
        hasStore={Boolean(store)}
        storeSlug={store?.slug}
      />

      {showCatalogLaunchCta && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-600/15 via-slate-900 to-pink-600/10 shadow-xl shadow-purple-500/10">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                <Sparkles className="h-3.5 w-3.5" />
                Nuevo en premium
              </span>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">Crea tu catálogo digital para tu negocio de piñatas</h2>
                <p className="max-w-2xl text-sm text-purple-100/75">
                  Tu premium ya incluye página pública, datos de contacto y espacio para publicar tus productos sin pagar extra.
                </p>
              </div>
            </div>

            <Link href="/dashboard/tienda">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 sm:w-auto">
                Crear catálogo digital
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Catálogo Digital</CardTitle>
            <Store className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            {store ? (
              <div className="space-y-3">
                <p className="text-xl font-bold text-white">{store.businessName}</p>
                <div className="flex gap-2">
                  {canManageCatalog ? (
                    <Link href="/dashboard/tienda">
                      <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                        Editar catálogo
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="border-gray-700 text-gray-500">
                      Solo lectura
                    </Button>
                  )}
                  {canViewPublicCatalog && (
                    <Link href={`/catalogo/${store.slug}`} target="_blank">
                      <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver catálogo
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-500">
                  {canManageCatalog
                    ? 'Tu premium ya puede publicar un catálogo digital para tu negocio'
                    : 'Activa premium para crear y publicar tu tienda digital'}
                </p>
                {canManageCatalog ? (
                  <Link href="/dashboard/tienda">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="h-3 w-3 mr-1" />
                      Crear catálogo digital
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Productos</CardTitle>
            <Package className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-3xl font-bold text-white">{productCount}</p>
              <div className="flex gap-2">
                <Link href="/dashboard/productos">
                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                    Ver todos
                  </Button>
                </Link>
                {canManageCatalog ? (
                  <Link href="/dashboard/productos/nuevo">
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled className="bg-gray-800 text-gray-500">
                    Premium requerido
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {store && canViewPublicCatalog && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm">
              <ExternalLink className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">Tu catálogo público:</span>
              <Link
                href={`/catalogo/${store.slug}`}
                target="_blank"
                className="text-purple-400 hover:text-purple-300 font-medium break-all"
              >
                pinataposter.com/catalogo/{store.slug}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
