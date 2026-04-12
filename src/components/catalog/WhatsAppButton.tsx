'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phoneNumber: string
  message?: string
  className?: string
}

export function WhatsAppButton({ phoneNumber, message, className }: WhatsAppButtonProps) {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
  const encodedMessage = encodeURIComponent(message || '¡Hola! Vi tu catálogo en PiñataPoster y me interesa una piñata.')
  const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-105 cursor-pointer">
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium text-sm">WhatsApp</span>
      </div>
    </a>
  )
}
