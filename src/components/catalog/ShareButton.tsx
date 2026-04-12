'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
}

export function ShareButton({ url, title, description }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url })
      } catch {
        // user cancelled
      }
    } else {
      await copyToClipboard()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('¡Enlace copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="border-gray-700 text-gray-300 hover:text-white"
    >
      {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
      Compartir
    </Button>
  )
}
