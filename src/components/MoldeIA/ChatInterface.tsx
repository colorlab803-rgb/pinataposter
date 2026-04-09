'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Bot, Loader2, Plus, X } from 'lucide-react'
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
  conversationId: string | null
  initialMessages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
  userSettings?: import('@/lib/chatStorage').UserSettings | null
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy **MoldeGPT** 🪅\n\nEnvíame la foto de tu piñata y yo me encargo de crear el molde listo para imprimir.\n\n📷 Arrastra una imagen aquí, pégala, o usa el botón de foto.',
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
  conversationId,
  initialMessages,
  onMessagesChange,
  userSettings,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? [WELCOME_MESSAGE])
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

  const isEmptyState = messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome')

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    setMessages(initialMessages ?? [WELCOME_MESSAGE])
    setPendingImage(null)
    setInput('')
  }, [conversationId, initialMessages])

  // Notificar al padre cuando cambian los mensajes
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome')) {
      onMessagesChange?.(messages)
    }
  }, [messages, onMessagesChange])

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
    const updatedMessages = [...messages.filter((m) => m.id !== 'welcome'), userMessage]
    setMessages(updatedMessages)
    setInput('')
    setPendingImage(null)
    setIsLoading(true)

    const thinkingId = (Date.now() + 1).toString()

    try {
      const chatMessages = updatedMessages
        .map((m) => ({ role: m.role, content: m.content }))

      const generatorState = { tieneImagen: hasImage || generatorReady }

      const res = await fetch('/api/molde-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          imageBase64: imageForApi?.base64,
          imageMimeType: imageForApi?.mimeType,
          generatorState,
          userSettings: userSettings ?? undefined,
        }),
      })

      if (!res.ok) throw new Error('Error en la API')

      const data = await res.json()
      const toolCalls: ToolCall[] = data.toolCalls ?? []

      if (toolCalls.length > 0) {
        const progressMessage: Message = {
          id: thinkingId,
          role: 'assistant',
          content: '',
          toolCalls,
          toolCallsStatus: 'running',
        }
        setMessages((prev) => [...prev, progressMessage])
        await executeToolCalls(toolCalls)
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

  // ── Input bar component (reused in empty + chat states) ──
  const inputBar = (
    <div className={`w-full ${isEmptyState ? 'max-w-2xl' : 'max-w-3xl'} mx-auto`}>
      {/* Pending image preview */}
      {pendingImage && (
        <div className="mb-2 flex items-start">
          <div className="relative inline-block">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
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
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#424242] text-white rounded-full flex items-center justify-center hover:bg-[#555] border border-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="relative bg-[#2f2f2f] rounded-3xl border border-white/5 shadow-lg">
        <div className="flex items-end gap-1 p-2">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
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

          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envía una foto o pregunta algo"
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 px-1 text-[15px] text-white placeholder:text-white/40 focus:outline-none max-h-40 min-h-[36px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 160)}px`
            }}
            disabled={isLoading}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !pendingImage) || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-20 disabled:from-gray-600 disabled:to-gray-600"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-white/25 mt-2 text-center">
        MoldeGPT puede cometer errores. Verifica la información importante.
      </p>
    </div>
  )

  return (
    <div
      className="flex flex-col h-full bg-[#212121] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-purple-600/15 border-2 border-dashed border-purple-400/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Plus className="h-12 w-12 text-purple-400 mx-auto mb-2" />
            <p className="text-purple-200 text-lg font-medium">Suelta la imagen aquí</p>
          </div>
        </div>
      )}

      {isEmptyState ? (
        /* ── Empty state: centered like ChatGPT ── */
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="mb-8 text-center">
            <h1 className="text-[28px] font-medium bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              ¿En qué te puedo ayudar?
            </h1>
          </div>
          <div className="w-full px-2">
            {inputBar}
          </div>
        </div>
      ) : (
        /* ── Chat state: messages + bottom input ── */
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="py-2">
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
                      <span className="text-sm text-white/40">Pensando…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            {inputBar}
          </div>
        </>
      )}
    </div>
  )
}
