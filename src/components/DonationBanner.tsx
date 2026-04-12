'use client'

import { useState } from 'react'
import { Heart, Copy, Check } from 'lucide-react'

const accounts = [
  { label: 'Nacional (MX)', value: '646990404071880785' },
  { label: 'Internacional', value: '170002404071880783' },
  { label: 'BIC/SWIFT', value: 'REVOMXM2' },
]

export function DonationBanner() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  function handleCopy(value: string, index: number) {
    navigator.clipboard.writeText(value)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 text-red-400 fill-red-400" />
            <p className="text-sm text-purple-200 font-medium">
              ¿Te gusta PiñataPoster? Ayúdanos a mantenerlo gratis
            </p>
          </div>
          <p className="text-xs text-purple-300/60 max-w-md mx-auto">
            Tu donación nos permite mejorar la herramienta y agregar nuevas funciones para toda la comunidad piñatera.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
            {accounts.map((account, i) => (
              <button
                key={i}
                onClick={() => handleCopy(account.value, i)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs group"
              >
                <span className="text-purple-300/60">{account.label}:</span>
                <span className="font-mono text-purple-200">{account.value}</span>
                {copiedIndex === i ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
