'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, MapPin, ExternalLink, Package } from 'lucide-react'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { ShareButton } from '@/components/catalog/ShareButton'
import { STORE_THEMES, type Store, type Product } from '@/lib/types/catalog'

function getThemeGradient(theme: string) {
  return STORE_THEMES.find((t) => t.value === theme)?.colors || STORE_THEMES[0].colors
}

interface CatalogoClientProps {
  slug: string
}

export default function CatalogoClient({ slug }: CatalogoClientProps) {
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    async function load() {
      try {
        const storeRes = await fetch(`/api/stores/${slug}`)
        if (!storeRes.ok) {
          setError(true)
          return
        }
        const storeData = await storeRes.json()
        setStore(storeData.store)

        const productsRes = await fetch(`/api/stores/${slug}/products`)
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData.products || [])
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🪅</p>
          <h1 className="text-xl font-bold text-white mb-2">Catálogo no encontrado</h1>
          <p className="text-gray-400 mb-6">Este catálogo no existe o fue eliminado</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Ir a PiñataPoster
          </Link>
        </div>
      </div>
    )
  }

  const gradient = getThemeGradient(store.theme)
  const categories = ['all', ...new Set(products.filter((p) => p.category).map((p) => p.category))]
  const filteredProducts = selectedCategory === 'all'
    ? products.filter((p) => p.available)
    : products.filter((p) => p.available && p.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header / Hero */}
      <header className="relative">
        {store.bannerImage ? (
          <div className="h-48 sm:h-64 relative overflow-hidden">
            <img src={store.bannerImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
          </div>
        ) : (
          <div className={`h-32 sm:h-48 bg-gradient-to-r ${gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
          </div>
        )}

        <div className="relative px-4 sm:px-6 max-w-5xl mx-auto -mt-12 sm:-mt-16">
          <div className="flex items-end gap-4">
            {store.logo ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-gray-950 bg-gray-900 flex-shrink-0 shadow-xl">
                <img src={store.logo} alt={store.businessName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-gray-950 bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 shadow-xl`}>
                🪅
              </div>
            )}
            <div className="pb-1 min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{store.businessName}</h1>
              {store.location?.city && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {[store.location.city, store.location.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {store.description && (
            <p className="text-gray-400 text-sm mt-4 max-w-2xl">{store.description}</p>
          )}

          <div className="flex items-center gap-3 mt-4">
            {store.socialMedia?.instagram && (
              <a href={`https://instagram.com/${store.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 text-sm">
                Instagram
              </a>
            )}
            {store.socialMedia?.facebook && (
              <a href={store.socialMedia.facebook.startsWith('http') ? store.socialMedia.facebook : `https://facebook.com/${store.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 text-sm">
                Facebook
              </a>
            )}
            {store.socialMedia?.tiktok && (
              <a href={`https://tiktok.com/${store.socialMedia.tiktok.startsWith('@') ? '' : '@'}${store.socialMedia.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">
                TikTok
              </a>
            )}
            <ShareButton
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`${store.businessName} — Catálogo de Piñatas`}
              description={store.description}
            />
          </div>
        </div>
      </header>

      {/* Filtro por categoría */}
      {categories.length > 2 && (
        <div className="px-4 sm:px-6 max-w-5xl mx-auto mt-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de productos */}
      <div className="px-4 sm:px-6 max-w-5xl mx-auto mt-6 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/catalogo/${slug}/${product.id}`}
                className="group bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-purple-500/5"
              >
                <div className="aspect-square bg-gray-800 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                    {product.name}
                  </h3>
                  <p className={`text-sm font-semibold mt-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    ${product.price.toLocaleString()} {product.currency}
                  </p>
                  {product.category && (
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center">
        <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          Hecho con 🪅 PiñataPoster
        </Link>
      </footer>

      {/* WhatsApp Button */}
      {store.whatsappNumber && (
        <WhatsAppButton
          phoneNumber={store.whatsappNumber}
          message={`¡Hola! Vi tu catálogo de ${store.businessName} en PiñataPoster y me interesa un producto.`}
        />
      )}
    </div>
  )
}
