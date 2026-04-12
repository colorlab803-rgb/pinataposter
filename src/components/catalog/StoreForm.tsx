'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { ImageUploader } from '@/components/catalog/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, ExternalLink, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { STORE_THEMES, type Store, type StoreTheme } from '@/lib/types/catalog'
import { cn } from '@/lib/utils'

export function StoreForm() {
  const { getIdToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState<string[]>([])
  const [bannerImage, setBannerImage] = useState<string[]>([])
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('México')
  const [theme, setTheme] = useState<StoreTheme>('default')

  useEffect(() => {
    async function load() {
      const token = await getIdToken()
      if (!token) return
      try {
        const res = await fetch('/api/stores', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          if (data.store) {
            const s: Store = data.store
            setIsNew(false)
            setBusinessName(s.businessName)
            setSlug(s.slug)
            setDescription(s.description)
            setLogo(s.logo ? [s.logo] : [])
            setBannerImage(s.bannerImage ? [s.bannerImage] : [])
            setWhatsappNumber(s.whatsappNumber)
            setInstagram(s.socialMedia?.instagram || '')
            setFacebook(s.socialMedia?.facebook || '')
            setTiktok(s.socialMedia?.tiktok || '')
            setCity(s.location?.city || '')
            setState(s.location?.state || '')
            setCountry(s.location?.country || 'México')
            setTheme(s.theme || 'default')
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [getIdToken])

  const checkSlug = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setSlugAvailable(null)
      return
    }
    setCheckingSlug(true)
    try {
      const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(value)}`)
      const data = await res.json()
      setSlugAvailable(data.available)
    } catch {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }, [])

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60)
    setSlug(clean)
    setSlugAvailable(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName.trim()) {
      toast.error('El nombre del negocio es requerido')
      return
    }
    if (!whatsappNumber.trim()) {
      toast.error('El WhatsApp es necesario para que tus clientes te contacten')
      return
    }

    setSaving(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('No autenticado')

      const body = {
        businessName,
        slug: isNew ? undefined : slug,
        description,
        logo: logo[0] || null,
        bannerImage: bannerImage[0] || null,
        whatsappNumber,
        socialMedia: { instagram: instagram || null, facebook: facebook || null, tiktok: tiktok || null },
        location: { city, state, country },
        theme,
      }

      const res = await fetch('/api/stores', {
        method: isNew ? 'POST' : 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      const data = await res.json()
      if (data.store?.slug) setSlug(data.store.slug)
      setIsNew(false)
      toast.success(isNew ? '¡Tienda creada!' : 'Tienda actualizada')
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
          <CardTitle className="text-white">Datos del negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Nombre del negocio *</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Piñatas Lupita"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {!isNew && (
            <div className="space-y-2">
              <Label className="text-gray-300">URL del catálogo</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">pinataposter.com/catalogo/</span>
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  onBlur={() => checkSlug(slug)}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                />
                {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                {slugAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                {slugAvailable === false && <X className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300">Descripción</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntale a tus clientes sobre tu negocio..."
              rows={3}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Logo</Label>
              <ImageUploader
                images={logo}
                onChange={setLogo}
                folder="logos"
                single
                label="Subir logo"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Banner (opcional)</Label>
              <ImageUploader
                images={bannerImage}
                onChange={setBannerImage}
                folder="banners"
                single
                label="Subir banner"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">WhatsApp * (con código de país)</Label>
            <Input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+52 1 55 1234 5678"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-gray-300">Instagram</Label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@tupinateria"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Facebook</Label>
              <Input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/tupinateria"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">TikTok</Label>
              <Input
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@tupinateria"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-gray-300">Ciudad</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ciudad de México"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Estado</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CDMX"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">País</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Tema visual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STORE_THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all',
                  theme === t.value
                    ? 'border-white scale-105'
                    : 'border-gray-700 hover:border-gray-500'
                )}
              >
                <div className={`h-8 rounded bg-gradient-to-r ${t.colors} mb-2`} />
                <p className="text-sm text-gray-300">{t.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {isNew ? 'Crear tienda' : 'Guardar cambios'}
        </Button>
        {!isNew && slug && (
          <a href={`/catalogo/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver catálogo
            </Button>
          </a>
        )}
      </div>
    </form>
  )
}
