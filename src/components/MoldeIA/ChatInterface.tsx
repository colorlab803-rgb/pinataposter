'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Loader2, ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage, type Message } from './ChatMessage'
import Image from 'next/image'

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

interface ChatInterfaceProps {
  onConfigChange: (updates: { targetWidth?: string; targetHeight?: string; paperSize?: string; orientation?: string }) => void
  onImageLoad: (dataUrl: string) => void
  onUpscaleRequest: () => void
  onDownloadRequest: (format: 'pdf' | 'zip') => void
  generatorReady: boolean
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy **MoldeIA** 🪅\n\nEnvíame la foto de tu piñata y yo me encargo de crear el molde listo para imprimir.\n\n📷 Arrastra una imagen aquí, pégala, o usa el botón de foto.',
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, data] = dataUrl.split(',')
      const mimeType = header.match(/data:(.*);/)?.[1] ?? 'image/png'
      resolve({ base64: data, mimeType, dataUrl })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ChatInterface({
  onConfigChange,
  onImageLoad,
  onUpscaleRequest,
  onDownloadRequest,
  generatorReady,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingImage, setPendingImage] = useState<{
    base64: string
    mimeType: string
    dataUrl: string
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleImageFile(file)
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    try {
      const result = await fileToBase64(file)
      setPendingImage(result)
    } catch {
      console.error('Error leyendo imagen')
    }
  }

  const executeToolCalls = useCallback(
    async (toolCalls: ToolCall[]) => {
      for (let i = 0; i < toolCalls.length; i++) {
        const tc = toolCalls[i]
        // Delay entre herramientas para que el generador procese
        if (i > 0) await new Promise((r) => setTimeout(r, 400))

        switch (tc.name) {
          case 'configurarTamano': {
            const { ancho, alto } = tc.args as { ancho: number; alto: number }
            onConfigChange({ targetWidth: String(ancho), targetHeight: String(alto) })
            break
          }
          case 'configurarPapel': {
            const { tamanoPapel, orientacion } = tc.args as { tamanoPapel: string; orientacion: string }
            onConfigChange({ paperSize: tamanoPapel, orientation: orientacion })
            break
          }
          case 'upscalarImagen':
            onUpscaleRequest()
            break
          case 'descargarMolde': {
            const { formato } = tc.args as { formato: 'pdf' | 'zip' }
            // Esperar a que el generador esté listo antes de descargar
            await new Promise((r) => setTimeout(r, 2000))
            onDownloadRequest(formato)
            break
          }
        }
      }
    },
    [onConfigChange, onUpscaleRequest, onDownloadRequest]
  )

  const sendMessage = async () => {
    const text = input.trim()
    const hasImage = !!pendingImage
    if ((!text && !hasImage) || isLoading) return

    // Si hay imagen, cargarla en el generador
    if (pendingImage) {
      onImageLoad(pendingImage.dataUrl)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || (hasImage ? '📷 Imagen enviada' : ''),
      imageUrl: pendingImage?.dataUrl,
    }

    const imageForApi = pendingImage
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setPendingImage(null)
    setIsLoading(true)

    // Agregar placeholder del asistente "pensando"
    const thinkingId = (Date.now() + 1).toString()

    try {
      const chatMessages = updatedMessages
        .filter((m) => m.id !== 'welcome' || m.content)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const generatorState = {
        tieneImagen: hasImage || generatorReady,
      }

      const res = await fetch('/api/molde-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          imageBase64: imageForApi?.base64,
          imageMimeType: imageForApi?.mimeType,
          generatorState,
        }),
      })

      if (!res.ok) throw new Error('Error en la API')

      const data = await res.json()
      const toolCalls: ToolCall[] = data.toolCalls ?? []

      if (toolCalls.length > 0) {
        // Mostrar tool calls como "en progreso"
        const progressMessage: Message = {
          id: thinkingId,
          role: 'assistant',
          content: '',
          toolCalls,
          toolCallsStatus: 'running',
        }
        setMessages((prev) => [...prev, progressMessage])

        // Ejecutar tool calls secuencialmente
        await executeToolCalls(toolCalls)

        // Actualizar a "completado" y agregar texto
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingId
              ? { ...m, content: data.text ?? '', toolCallsStatus: 'done' as const }
              : m
          )
        )
      } else {
        const assistantMessage: Message = {
          id: thinkingId,
          role: 'assistant',
          content: data.text ?? '',
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: thinkingId,
          role: 'assistant' as const,
          content: '❌ Ocurrió un error. Por favor intenta de nuevo.',
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

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageFile(file)
  }

  return (
    <div
      className="flex flex-col h-full bg-slate-950/80 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay de drag */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-purple-600/20 border-2 border-dashed border-purple-400 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <ImagePlus className="h-12 w-12 text-purple-400 mx-auto mb-2" />
            <p className="text-purple-200 text-lg font-medium">Suelta la imagen aquí</p>
          </div>
        </div>
      )}

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
              <span className="text-sm text-purple-300">Analizando…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview de imagen pendiente */}
      {pendingImage && (
        <div className="px-4 py-2 border-t border-white/10 bg-black/20">
          <div className="relative inline-block">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-purple-500/30">
              <Image
                src={pendingImage.dataUrl}
                alt="Imagen a enviar"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex gap-2 items-end">
          {/* Botón de imagen */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 flex-shrink-0 text-white/40 hover:text-purple-400 hover:bg-purple-500/10"
            disabled={isLoading}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageFile(file)
              e.target.value = ''
            }}
          />

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingImage ? 'Describe tu piñata o envía directo…' : 'Envía una foto o escribe aquí…'}
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
            disabled={(!input.trim() && !pendingImage) || isLoading}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 rounded-xl h-10 w-10 flex-shrink-0 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-white/20 mt-1.5 text-center">
          📷 Pega imagen · Arrastra · Adjunta · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
