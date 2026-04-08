'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Scissors, Wand2, SplitSquareHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PosterGenerator } from '@/components/PosterGenerator'
import { ChatInterface } from '@/components/MoldeIA/ChatInterface'

type PaperSize = 'Letter' | 'Legal' | 'Tabloid' | 'A4' | 'A3'
type Orientation = 'portrait' | 'landscape'

interface GeneratorConfig {
  targetWidth?: string
  targetHeight?: string
  paperSize?: string
  orientation?: string
  hasImage?: boolean
  imageSrc?: string | null
}

type ActivePanel = 'chat' | 'generator'

export default function ChatPage() {
  const [config, setConfig] = useState<GeneratorConfig>({})
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null)
  const [externalProcessedImage, setExternalProcessedImage] = useState<string | null | undefined>(undefined)
  const [triggerDownload, setTriggerDownload] = useState<{ format: 'pdf' | 'zip' } | null>(null)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat')
  const triggerRef = useRef<{ format: 'pdf' | 'zip' } | null>(null)

  const handleConfigChange = useCallback((updates: Partial<GeneratorConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleProcessedImageChange = useCallback((src: string | null) => {
    setCurrentImageSrc(src)
    setConfig((prev) => ({ ...prev, hasImage: !!src, imageSrc: src }))
  }, [])

  const handleUpscaleRequest = useCallback(async () => {
    if (!currentImageSrc) {
      toast.error('Sin imagen', { description: 'Primero sube una imagen en el generador.' })
      return
    }

    setIsUpscaling(true)
    toast.loading('Mejorando imagen con IA…', { id: 'upscale' })

    try {
      // Convertir src a base64 si es data URL
      let imageBase64: string
      let mimeType: string

      if (currentImageSrc.startsWith('data:')) {
        const [header, data] = currentImageSrc.split(',')
        imageBase64 = data
        mimeType = header.match(/data:(.*);/)?.[1] ?? 'image/png'
      } else {
        // Es una URL, necesitamos obtenerla como base64
        const res = await fetch(currentImageSrc)
        const blob = await res.blob()
        mimeType = blob.type || 'image/png'
        const buffer = await blob.arrayBuffer()
        const uint8 = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i])
        }
        imageBase64 = btoa(binary)
      }

      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? 'Error en upscale')
      }

      const data = await response.json()
      const newSrc = `data:${data.mimeType};base64,${data.imageBase64}`
      setExternalProcessedImage(newSrc)
      toast.success('¡Imagen mejorada!', {
        id: 'upscale',
        description: 'La calidad de la imagen ha sido mejorada con IA.',
      })
    } catch (error) {
      console.error('Upscale error:', error)
      toast.error('Error al mejorar imagen', {
        id: 'upscale',
        description: error instanceof Error ? error.message : 'Intenta de nuevo.',
      })
    } finally {
      setIsUpscaling(false)
    }
  }, [currentImageSrc])

  const handleDownloadRequest = useCallback((format: 'pdf' | 'zip') => {
    // Usar un objeto nuevo cada vez para que el useEffect del generador se dispare
    const trigger = { format }
    triggerRef.current = trigger
    setTriggerDownload(trigger)
    // Resetear después para permitir múltiples descargas
    setTimeout(() => setTriggerDownload(null), 500)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl flex-shrink-0 z-20">
        <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-white/60 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Wand2 className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">MoldeIA</span>
                <span className="text-white/40 mx-1.5 hidden sm:inline">·</span>
                <span className="text-xs text-white/40 hidden sm:inline">Chat agéntico · PiñataPoster</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switcher para móvil */}
            <div className="flex sm:hidden bg-white/10 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setActivePanel('chat')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activePanel === 'chat' ? 'bg-purple-600 text-white' : 'text-white/50'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActivePanel('generator')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activePanel === 'generator' ? 'bg-purple-600 text-white' : 'text-white/50'
                }`}
              >
                Molde
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40">
              <SplitSquareHorizontal className="h-3.5 w-3.5" />
              <span>Vista dividida</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Indicador de upscale */}
      {isUpscaling && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-purple-700 text-white text-sm rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Wand2 className="h-3.5 w-3.5" />
          Mejorando imagen con IA…
        </div>
      )}

      {/* Contenido principal - split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Chat - izquierda */}
        <div
          className={`
            w-full sm:w-2/5 lg:w-1/3 flex-shrink-0 overflow-hidden
            ${activePanel === 'chat' ? 'flex' : 'hidden sm:flex'}
          `}
        >
          <div className="w-full h-full">
            <ChatInterface
              generatorConfig={{
                targetWidth: config.targetWidth,
                targetHeight: config.targetHeight,
                paperSize: config.paperSize,
                orientation: config.orientation,
                hasImage: config.hasImage,
              }}
              onConfigChange={handleConfigChange}
              onUpscaleRequest={handleUpscaleRequest}
              onDownloadRequest={handleDownloadRequest}
            />
          </div>
        </div>

        {/* Panel Generador - derecha */}
        <div
          className={`
            flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-background/95
            ${activePanel === 'generator' ? 'flex flex-col' : 'hidden sm:flex sm:flex-col'}
          `}
        >
          <div className="p-2 sm:p-0">
            <PosterGenerator
              controlledWidth={config.targetWidth}
              controlledHeight={config.targetHeight}
              controlledPaperSize={config.paperSize as PaperSize | undefined}
              controlledOrientation={config.orientation as Orientation | undefined}
              externalProcessedImageSrc={externalProcessedImage}
              onProcessedImageChange={handleProcessedImageChange}
              triggerDownload={triggerDownload}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
