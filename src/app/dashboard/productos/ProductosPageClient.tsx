'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Loader2, Package, Trash2, Eye, EyeOff, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types/catalog'
import { CatalogPremiumGuard } from '@/components/catalog/CatalogPremiumGuard'

function ProductosPageContent() {
  const { getIdToken } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadProducts = useCallback(async () => {
    const token = await getIdToken()
    if (!token) return
    try {
      const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  async function toggleAvailability(product: Product) {
    const token = await getIdToken()
    if (!token) return
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !product.available }),
      })
      if (res.ok) {
        setProducts(products.map((p) =>
          p.id === product.id ? { ...p, available: !p.available } : p
        ))
        toast.success(product.available ? 'Producto ocultado' : 'Producto visible')
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    const token = await getIdToken()
    if (!token) return
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id))
        toast.success('Producto eliminado')
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-gray-400 mt-1">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/productos/nuevo">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Aún no tienes productos en tu catálogo</p>
            <Link href="/dashboard/productos/nuevo">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Agregar tu primer producto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {product.images?.[0] ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{product.name}</h3>
                      {!product.available && (
                        <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">
                          Oculto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-purple-400 font-medium">
                        ${product.price} {product.currency}
                      </span>
                      {product.category && (
                        <span className="text-xs text-gray-500">{product.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleAvailability(product)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      title={product.available ? 'Ocultar' : 'Mostrar'}
                    >
                      {product.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <Link href={`/dashboard/productos/${product.id}`}>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductosPageClient() {
  return (
    <CatalogPremiumGuard>
      <ProductosPageContent />
    </CatalogPremiumGuard>
  )
}
