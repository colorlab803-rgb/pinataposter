'use client'

import { Eye, EyeOff, Wand2, Package, Sparkles } from 'lucide-react'

interface DownloadInfoProps {
  hasCredits: boolean
  watermark: boolean
  loggedIn: boolean
  designCredits: number
  freeDownloadsUsed: number
  freeDownloadsLimit: number
}

export function DownloadInfo({
  hasCredits,
  watermark,
  loggedIn,
  designCredits,
  freeDownloadsUsed,
  freeDownloadsLimit,
}: DownloadInfoProps) {
  if (!loggedIn) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1.5">
        <p className="font-medium text-white flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-gray-400" />
          Tu descarga incluirá marca de agua
        </p>
        <p className="text-purple-300/60 ml-5">
          Inicia sesión y compra créditos para descargar sin marca de agua.
        </p>
      </div>
    )
  }

  if (hasCredits) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
        <p className="font-medium text-white flex items-center gap-1.5">
          <EyeOff className="h-3.5 w-3.5 text-purple-400" />
          Descarga sin marca de agua
        </p>
        <div className="flex items-center gap-3 ml-5 text-purple-300/70">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Se usará 1 de tus {designCredits} crédito{designCredits !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Wand2 className="h-3 w-3" />
            Mejora AI disponible
          </span>
        </div>
      </div>
    )
  }

  // Free registered user
  const freeRemaining = freeDownloadsLimit - freeDownloadsUsed
  if (freeRemaining > 0) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs space-y-1.5">
        <p className="font-medium text-white flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-green-400" />
          Descarga gratis disponible
        </p>
        <div className="flex items-center gap-3 ml-5 text-purple-300/70 flex-wrap">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Incluye marca de agua
          </span>
          <span className="text-purple-300/40">•</span>
          <span>Se usará tu diseño gratis del día</span>
        </div>
      </div>
    )
  }

  return null
}
