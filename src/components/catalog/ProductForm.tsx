'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ImageUploader } from '@/components/catalog/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PRODUCT_CATEGORIES, MAX_PRODUCT_IMAGES, type Product, type ProductSize } from '@/lib/types/catalog'

interface ProductFormProps {
  productId?: string
}

export function ProductForm({ productId }: ProductFormProps) {
  const { getIdToken } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(!!productId)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [category, setCategory] = useState('')
  const [sizes, setSizes] = useState<ProductSize[]>([])
  const [images, setImages] = useState<string[]>([])
  const [available, setAvailable] = useState(true)
  const [productionTime, setProductionTime] = useState('')

  useEffect(() => {
    if (!productId) return
    async function load() {
      const token = await getIdToken()
      if (!token) return
      try {
        const res = await fetch(`/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const p: Product = data.product
          setName(p.name)
          setDescription(p.description)
          setPrice(String(p.price))
          setCurrency(p.currency)
          setCategory(p.category)
          setSizes(p.sizes || [])
          setImages(p.images || [])
          setAvailable(p.available)
          setProductionTime(p.productionTime)
        } else {
          toast.error('Producto no encontrado')
          router.push('/dashboard/productos')
        }
      } catch {
        toast.error('Error al cargar producto')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId, getIdToken, router])

  const addSize = () => {
    setSizes([...sizes, { name: '', price: 0 }])
  }

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    const updated = [...sizes]
    if (field === 'price') {
      updated[index] = { ...updated[index], price: Number(value) || 0 }
    } else {
      updated[index] = { ...updated[index], name: String(value) }
    }
    setSizes(updated)
  }

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre del producto es requerido')
      return
    }

    setSaving(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('No autenticado')

      const body = {
        name,
        description,
        price: Number(price) || 0,
        currency,
        category,
        sizes: sizes.filter((s) => s.name.trim()),
        images,
        available,
        productionTime,
      }

      const url = productId ? `/api/products/${productId}` : '/api/products'
      const method = productId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      toast.success(productId ? 'Producto actualizado' : '¡Producto agregado!')
      router.push('/dashboard/productos')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
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
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Información del producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Nombre *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Piñata de Estrella"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Descripción</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu piñata: materiales, colores, detalles especiales..."
              rows={3}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Precio base</Label>
              <div className="flex gap-2">
                <span className="flex items-center text-gray-500 text-sm">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="350"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-md bg-gray-800 border border-gray-700 text-white px-2 text-sm"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="COP">COP</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Categoría</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Tiempo de elaboración</Label>
            <Input
              value={productionTime}
              onChange={(e) => setProductionTime(e.target.value)}
              placeholder="3-5 días hábiles"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="available"
              checked={available}
              onCheckedChange={(checked) => setAvailable(checked as boolean)}
            />
            <Label htmlFor="available" className="text-gray-300 cursor-pointer">
              Disponible para venta
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Fotos del producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            images={images}
            onChange={setImages}
            maxImages={MAX_PRODUCT_IMAGES}
            folder="products"
            label="Subir fotos de tu piñata"
          />
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Tallas / Tamaños</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addSize} className="border-gray-700 text-gray-300">
            <Plus className="h-3 w-3 mr-1" /> Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {sizes.length === 0 ? (
            <p className="text-sm text-gray-500">Sin tallas adicionales. El precio base aplica.</p>
          ) : (
            <div className="space-y-3">
              {sizes.map((size, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={size.name}
                    onChange={(e) => updateSize(idx, 'name', e.target.value)}
                    placeholder="Ej: Grande (1m)"
                    className="bg-gray-800 border-gray-700 text-white flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={size.price || ''}
                      onChange={(e) => updateSize(idx, 'price', e.target.value)}
                      placeholder="450"
                      className="bg-gray-800 border-gray-700 text-white w-24"
                    />
                  </div>
                  <button type="button" onClick={() => removeSize(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/productos')}
          className="border-gray-700 text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {productId ? 'Guardar cambios' : 'Agregar producto'}
        </Button>
      </div>
    </form>
  )
}
