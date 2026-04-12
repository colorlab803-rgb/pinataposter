'use client'

import { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/AuthProvider'
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '@/lib/types/catalog'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  folder: string
  label?: string
  single?: boolean
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  folder,
  label = 'Subir imagen',
  single = false,
}: ImageUploaderProps) {
  const { getIdToken } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = single ? 1 - images.length : maxImages - images.length
    if (remainingSlots <= 0) {
      toast.error(`Máximo ${single ? 1 : maxImages} ${single ? 'imagen' : 'imágenes'}`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen`)
        return
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${file.name} excede ${MAX_IMAGE_SIZE_MB}MB`)
        return
      }
    }

    setUploading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('No autenticado')

      const newImages: string[] = []
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        if (!res.ok) throw new Error('Error al subir imagen')
        const data = await res.json()
        newImages.push(data.url)
      }

      if (single) {
        onChange(newImages)
      } else {
        onChange([...images, ...newImages])
      }
      toast.success(filesToUpload.length > 1 ? 'Imágenes subidas' : 'Imagen subida')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [images, onChange, maxImages, single, folder, getIdToken])

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className={single ? '' : 'grid grid-cols-2 sm:grid-cols-3 gap-3'}>
          {images.map((url, idx) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {!single && images.length > 1 && (
                <div className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white text-xs">
                  {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(single ? images.length === 0 : images.length < maxImages) && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-xs text-gray-600 mt-1">
                JPG, PNG · Máx {MAX_IMAGE_SIZE_MB}MB
                {!single && ` · ${images.length}/${maxImages}`}
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={!single}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
