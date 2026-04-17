'use client'

import { useState } from 'react'
import { Heart, Copy, Check, Coffee } from 'lucide-react'

const accounts = [
  { label: 'Nacional (MX)', value: '646990404071880785', emoji: '🇲🇽' },
  { label: 'Internacional', value: '170002404071880783', emoji: '🌎' },
  { label: 'BIC/SWIFT', value: 'REVOMXM2', emoji: '🏦' },
]

export function DonationBanner() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  function handleCopy(e: React.MouseEvent, value: string, index: number) {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-purple-900/30 to-pink-900/20" />
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
          <div className="text-center space-y-4">
            {/* Emotional hook */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
              <Coffee className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-xs text-pink-300 font-medium">Hecho con cariño en México</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white">
              PiñataPoster existe gracias a personas como tú
            </h3>
            
            <p className="text-sm text-purple-200/70 max-w-lg mx-auto leading-relaxed">
              Cada molde que imprimes, cada piñata que creas... es posible porque alguien decidió 
              apoyar este proyecto. <span className="text-purple-200 font-medium">¿Nos invitas un cafecito?</span> ☕
            </p>

            {/* Expand/collapse for accounts */}
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600/80 to-purple-600/80 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
              >
                <Heart className="h-4 w-4 fill-white/80" />
                Quiero apoyar
              </button>
            ) : (
              <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {accounts.map((account, i) => (
                    <button
                      key={i}
                      onClick={(e) => handleCopy(e, account.value, i)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-xs group"
                    >
                      <span>{account.emoji}</span>
                      <div className="text-left">
                        <span className="text-purple-300/50 text-[10px] block leading-tight">{account.label}</span>
                        <span className="font-mono text-purple-200">{account.value}</span>
                      </div>
                      {copiedIndex === i ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-purple-300/40">
                  Toca para copiar · No hay monto mínimo · Cada peso cuenta 💜
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
