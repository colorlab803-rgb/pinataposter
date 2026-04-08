import { Sparkles, Settings2, ArrowDownToLine, Wand2, CheckCircle2, ImageIcon } from 'lucide-react'

interface AgentActionProps {
  name: string
  args: Record<string, unknown>
  status?: 'running' | 'done'
}

const actionConfig: Record<string, {
  icon: React.ReactNode
  label: string
  formatArgs: (args: Record<string, unknown>) => string
}> = {
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
    formatArgs: (a) => `${a.tamanoPapel} — ${a.orientacion === 'portrait' ? 'Vertical' : 'Horizontal'}`,
  },
  upscalarImagen: {
    icon: <Wand2 className="h-3.5 w-3.5" />,
    label: 'Mejorando imagen',
    formatArgs: () => 'Upscale con IA…',
  },
  descargarMolde: {
    icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
    label: 'Generando molde',
    formatArgs: (a) => `Formato ${String(a.formato).toUpperCase()}`,
  },
}

export function AgentAction({ name, args, status = 'done' }: AgentActionProps) {
  const config = actionConfig[name] ?? {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    label: name,
    formatArgs: () => JSON.stringify(args),
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 w-fit max-w-xs">
      <span className="flex-shrink-0 text-purple-400">{config.icon}</span>
      <div className="min-w-0">
        <div className="font-medium text-purple-200">{config.label}</div>
        <div className="text-purple-400 truncate">{config.formatArgs(args)}</div>
      </div>
      {status === 'done' && (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0 ml-1" />
      )}
      {status === 'running' && (
        <div className="h-3.5 w-3.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin flex-shrink-0 ml-1" />
      )}
    </div>
  )
}
