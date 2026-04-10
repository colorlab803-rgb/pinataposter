'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Settings2, ArrowDownToLine, Wand2, CheckCircle2, ImageIcon } from 'lucide-react'

interface AgentActionProps {
  name: string
  args: Record<string, unknown>
  status?: 'running' | 'done'
}

interface ActionDef {
  icon: React.ReactNode
  label: string
  formatArgs: (args: Record<string, unknown>) => string
  runningText?: string
  doneLabel?: string
  duration?: number
}

const actionConfig: Record<string, ActionDef> = {
  analizarImagen: {
    icon: <ImageIcon className="h-3.5 w-3.5" />,
    label: 'Analizando imagen',
    formatArgs: () => 'Identificando diseño de piñata…',
  },
  configurarTamano: {
    icon: <Settings2 className="h-3.5 w-3.5" />,
    label: 'Configurando tamaño',
    formatArgs: (a) => `${a.ancho} × ${a.alto} cm`,
  },
  configurarPapel: {
    icon: <Settings2 className="h-3.5 w-3.5" />,
    label: 'Configurando papel',
    formatArgs: (a) =>
      `${a.tamanoPapel} — ${a.orientacion === 'portrait' ? 'Vertical' : 'Horizontal'}`,
  },
  upscalarImagen: {
    icon: <Wand2 className="h-3.5 w-3.5" />,
    label: 'Mejorando imagen',
    formatArgs: () => 'Real-ESRGAN 4x…',
    runningText: 'Mejorando resolución 4x… ~20s',
    doneLabel: 'Imagen mejorada ✓',
    duration: 25,
  },
  descargarMolde: {
    icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
    label: 'Preparando molde',
    formatArgs: (a) => `Upscale 4x + ${String(a.formato || 'pdf').toUpperCase()}`,
    runningText: 'Mejorando + generando… ~25s',
    doneLabel: 'Molde listo ✓',
    duration: 25,
  },
}

export function AgentAction({ name, args, status = 'done' }: AgentActionProps) {
  const config = actionConfig[name] ?? {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    label: name,
    formatArgs: () => JSON.stringify(args),
  }

  const isLong = !!(config.duration && config.runningText)
  const showBar = isLong && status === 'running'

  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    if (showBar) {
      const id = requestAnimationFrame(() => setAnimate(true))
      return () => { cancelAnimationFrame(id); setAnimate(false) }
    }
    setAnimate(false)
  }, [showBar])

  const detail =
    status === 'done' && config.doneLabel
      ? config.doneLabel
      : status === 'running' && config.runningText
        ? config.runningText
        : config.formatArgs(args)

  return (
    <div className="relative overflow-hidden rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 w-fit max-w-xs">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex-shrink-0 text-purple-400">{config.icon}</span>
        <div className="min-w-0">
          <div className="font-medium text-purple-200">{config.label}</div>
          <div className="text-purple-400 truncate">{detail}</div>
        </div>
        {status === 'done' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0 ml-1" />
        )}
        {status === 'running' && (
          <div className="h-3.5 w-3.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin flex-shrink-0 ml-1" />
        )}
      </div>
      {showBar && (
        <div className="h-0.5 w-full bg-purple-500/20">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{
              width: animate ? '95%' : '5%',
              transition: `width ${config.duration}s ease-out`,
            }}
          />
        </div>
      )}
    </div>
  )
}
