'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Package, Clock, Tag, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { ShareButton } from '@/components/catalog/ShareButton'
import { STORE_THEMES, type Store, type Product } from '@/lib/types/catalog'

function getThemeGradient(theme: string) {
  return STORE_THEMES.find((t) => t.value === theme)?.colors || STORE_THEMES[0].colors
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch(`/api/stores/${slug}`),
          fetch(`/api/stores/${slug}/products`),
        ])

        if (storeRes.ok) {
          const storeData = await storeRes.json()
          setStore(storeData.store)
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          const found = productsData.products?.find((p: Product) => p.id === productId)
          if (found) setProduct(found)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🪅</p>
          <h1 className="text-xl font-bold text-white mb-2">Producto no encontrado</h1>
          <Link href={`/catalogo/${slug}`} className="text-purple-400 hover:text-purple-300">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const gradient = getThemeGradient(store.theme)
  const whatsappMessage = `¡Hola! Me interesa "${product.name}" de tu catálogo ${store.businessName} en PiñataPoster.`

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/catalogo/${slug}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/catalogo/${slug}`} className="text-sm text-gray-400 hover:text-white truncate">
              {store.businessName}
            </Link>
          </div>
          <ShareButton
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={`${product.name} — ${store.businessName}`}
            description={product.description}
          />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Galería de imágenes */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-600" />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === idx ? 'border-purple-500' : 'border-gray-800'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info del producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{product.name}</h1>
              {product.category && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-xs">
                  <Tag className="h-3 w-3" />
                  {product.category}
                </span>
              )}
            </div>

            <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              ${product.price.toLocaleString()} {product.currency}
            </div>

            {product.description && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 mb-2">Descripción</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 mb-2">Tallas / Tamaños</h2>
                <div className="space-y-2">
                  {product.sizes.map((size, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
                      <span className="text-gray-300">{size.name}</span>
                      <span className="text-purple-400 font-medium">${size.price.toLocaleString()} {product.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.productionTime && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="h-4 w-4" />
                <span>Tiempo de elaboración: {product.productionTime}</span>
              </div>
            )}

            {store.whatsappNumber && (
              <a
                href={`https://wa.me/${store.whatsappNumber.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white mt-4">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Preguntar por WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      {store.whatsappNumber && (
        <WhatsAppButton phoneNumber={store.whatsappNumber} message={whatsappMessage} />
      )}
    </div>
  )
}
