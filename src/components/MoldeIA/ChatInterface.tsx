'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage, type Message } from './ChatMessage'

interface GeneratorConfig {
  targetWidth?: string
  targetHeight?: string
  paperSize?: string
  orientation?: string
  hasImage?: boolean
  imageBase64?: string
  imageMimeType?: string
}

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

interface ChatInterfaceProps {
  generatorConfig: GeneratorConfig
  onConfigChange: (updates: Partial<GeneratorConfig>) => void
  onUpscaleRequest: () => void
  onDownloadRequest: (format: 'pdf' | 'zip') => void
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy **MoldeIA** 🪅\n\nEstoy aquí para ayudarte a crear tu molde de piñata paso a paso.\n\n¿Qué tipo de molde quieres crear hoy? Cuéntame un poco sobre tu proyecto.',
}

export function ChatInterface({
  generatorConfig,
  onConfigChange,
  onUpscaleRequest,
  onDownloadRequest,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleToolCall = useCallback(
    (toolCall: ToolCall) => {
      switch (toolCall.name) {
        case 'configurarTamano': {
          const { ancho, alto } = toolCall.args as { ancho: number; alto: number }
          onConfigChange({
            targetWidth: String(ancho),
            targetHeight: String(alto),
          })
          break
        }
        case 'configurarPapel': {
          const { tamanoPapel, orientacion } = toolCall.args as {
            tamanoPapel: string
            orientacion: string
          }
          onConfigChange({ paperSize: tamanoPapel, orientation: orientacion })
          break
        }
        case 'upscalarImagen': {
          onUpscaleRequest()
          break
        }
        case 'descargarMolde': {
          const { formato } = toolCall.args as { formato: 'pdf' | 'zip' }
          onDownloadRequest(formato)
          break
        }
      }
    },
    [onConfigChange, onUpscaleRequest, onDownloadRequest]
  )

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Enviar todos los mensajes al API
      const chatMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Estado del generador sin la imagen (demasiado pesada para el contexto)
      const stateForContext = {
        targetWidth: generatorConfig.targetWidth,
        targetHeight: generatorConfig.targetHeight,
        paperSize: generatorConfig.paperSize,
        orientation: generatorConfig.orientation,
        tieneImagen: !!generatorConfig.hasImage,
      }

      const res = await fetch('/api/molde-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          generatorState: stateForContext,
        }),
      })

      if (!res.ok) {
        throw new Error('Error en la API')
      }

      const data = await res.json()
      const toolCalls: ToolCall[] = data.toolCalls ?? []

      // Ejecutar tool calls
      for (const tc of toolCalls) {
        handleToolCall(tc)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text ?? '',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Wand2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">MoldeIA</h2>
          <p className="text-xs text-purple-400">Asistente de piñatas · Gemini</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">En línea</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white/10 border border-white/10 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
              <span className="text-sm text-purple-300">Pensando…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje… (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/15 transition-colors max-h-32 min-h-[40px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`
            }}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 rounded-xl h-10 w-10 flex-shrink-0 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-white/20 mt-1.5 text-center">
          Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
