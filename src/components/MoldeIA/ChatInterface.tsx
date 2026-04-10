'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Bot, Loader2, Plus, X, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { ChatMessage, type Message, type QuickAction } from './ChatMessage'
import { ChatOnboarding } from './ChatOnboarding'
import { WELCOME_MESSAGE } from '@/lib/chatStorage'
import Image from 'next/image'

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

interface ChatInterfaceProps {
  onConfigChange: (updates: { targetWidth?: string; targetHeight?: string; paperSize?: string; orientation?: string }) => void
  onImageLoad: (dataUrl: string) => void
  onUpscaleRequest: () => Promise<void>
  onDownloadRequest: (format: 'pdf' | 'zip') => void
  generatorReady: boolean
  conversationId: string | null
  initialMessages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
  userSettings?: import('@/lib/chatStorage').UserSettings | null
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

  const abortControllerRef = useRef<AbortController | null>(null)
  const prevConvIdRef = useRef<string | null | undefined>(undefined)
  const lastUserTextRef = useRef<string>('')

  const isEmptyState = messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome')

  // ── Suggestion chips for empty state ──
  const suggestionChips = [
    { icon: '🪅', label: 'Hacer un molde', message: 'Quiero hacer un molde de piñata' },
    { icon: '📐', label: 'Ya tengo las medidas', message: 'Quiero hacer un molde, ya tengo las medidas' },
    { icon: '❓', label: '¿Cómo funciona?', message: '¿Cómo funciona PinataPoster?' },
  ]

  // ── Derive quick actions from last assistant message ──
  const getQuickActions = useCallback((msgs: Message[]): QuickAction[] => {
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')
    if (!lastAssistant) return []

    const lastToolName = lastAssistant.toolCalls?.slice(-1)[0]?.name
    const hasImage = msgs.some((m) => m.role === 'user' && m.imageUrl)
    const text = lastAssistant.content.toLowerCase()

    // After descargarMolde completed
    if (lastToolName === 'descargarMolde' && lastAssistant.toolCallsStatus === 'done') {
      return [
        { label: '📐 Cambiar tamaño', message: 'Quiero cambiar el tamaño' },
        { label: '📄 Cambiar papel', message: 'Quiero cambiar el papel' },
        { label: '🆕 Nuevo molde', message: 'Quiero hacer un molde nuevo' },
      ]
    }

    // After configurarPapel — offer to generate
    if (lastToolName === 'configurarPapel' && lastAssistant.toolCallsStatus === 'done') {
      return [
        { label: '✅ Generar molde', message: 'Generar el molde' },
        { label: '📐 Cambiar tamaño', message: 'Quiero cambiar el tamaño' },
      ]
    }

    // After configurarTamano — offer paper options
    if (lastToolName === 'configurarTamano' && lastAssistant.toolCallsStatus === 'done') {
      return [
        { label: '📄 Carta', message: 'Papel Carta' },
        { label: '📄 Oficio', message: 'Papel Oficio' },
        { label: '📄 Doble Carta', message: 'Papel Doble Carta' },
      ]
    }

    // After image analysis (AI asking for size) — no presets, user types freely

    return []
  }, [])

  // Cancelar request al desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Cargar mensajes cuando se cambia de conversación (switch real, no auto-creación)
  useEffect(() => {
    const prev = prevConvIdRef.current
    prevConvIdRef.current = conversationId

    // Primera renderización: no resetear, ya se inicializó con useState
    if (prev === undefined) return

    // Auto-asignación de ID a conversación nueva (null → id): no resetear
    // Esto pasa cuando se envía el primer mensaje y handleMessagesChange crea el ID
    if (prev === null && conversationId !== null) return

    // Cambio real de conversación: resetear estado y abortar request pendiente
    abortControllerRef.current?.abort()
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
            if (!generatorReady) {
              toast.error('Sin imagen', { description: 'Sube una imagen primero para poder mejorarla.' })
              break
            }
            onUpscaleRequest()
            break
          case 'descargarMolde': {
            if (!generatorReady) {
              toast.error('Sin imagen', { description: 'Sube una imagen primero para generar el molde.' })
              break
            }
            // Siempre hacer upscale antes de generar el PDF
            await onUpscaleRequest()
            await new Promise((r) => setTimeout(r, 500))
            if (userSettings?.autoDownloadPdf) {
              const fmt = (tc.args.formato as 'pdf' | 'zip') || 'pdf'
              onDownloadRequest(fmt)
            }
            break
          }
        }
      }
    },
    [onConfigChange, onUpscaleRequest, onDownloadRequest, userSettings?.autoDownloadPdf, generatorReady]
  )

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
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
    lastUserTextRef.current = text

    const assistantId = (Date.now() + 1).toString()

    try {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const chatMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
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
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('Error en la API')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No se pudo leer el stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let allToolCalls: ToolCall[] = []
      let messageCreated = false
      let deferredText = ''
      let hasDescargarMolde = false

      const ensureMessage = () => {
        if (!messageCreated) {
          messageCreated = true
          setIsLoading(false)
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant' as const, content: '' },
          ])
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          if (!jsonStr) continue

          try {
            const event = JSON.parse(jsonStr)

            switch (event.type) {
              case 'text':
                ensureMessage()
                if (hasDescargarMolde) {
                  // Diferir texto hasta que los tools terminen
                  deferredText += event.content
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + event.content } : m
                    )
                  )
                }
                break
              case 'tool_calls': {
                ensureMessage()
                const calls = (event.calls ?? []) as ToolCall[]
                allToolCalls = [...allToolCalls, ...calls]
                if (calls.some((tc: ToolCall) => tc.name === 'descargarMolde')) {
                  hasDescargarMolde = true
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolCalls: allToolCalls, toolCallsStatus: 'running' as const }
                      : m
                  )
                )
                await executeToolCalls(calls)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, toolCallsStatus: 'done' as const } : m
                  )
                )
                // Mostrar texto diferido ahora que los tools terminaron
                if (deferredText) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + deferredText } : m
                    )
                  )
                  deferredText = ''
                }
                break
              }
              case 'error':
                ensureMessage()
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: `❌ ${event.message || 'Algo salió mal.'}`,
                          quickActions: [{ label: '🔄 Reintentar', message: lastUserTextRef.current || 'Reintentar' }],
                        }
                      : m
                  )
                )
                break
            }
          } catch (parseError) {
            if (jsonStr.trim()) {
              console.warn('SSE JSON parse error:', parseError, 'line:', jsonStr.slice(0, 100))
            }
          }
        }
      }

      // Si quedó texto diferido sin tool_calls posteriores, mostrarlo
      if (deferredText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + deferredText } : m
          )
        )
      }

      // Inject quick actions on the last assistant message
      setMessages((prev) => {
        const actions = getQuickActions(prev)
        if (actions.length === 0) return prev
        return prev.map((m) =>
          m.id === assistantId ? { ...m, quickActions: actions } : m
        )
      })
    } catch (error) {
      // Ignorar abortos (cambio de conversación)
      if (error instanceof DOMException && error.name === 'AbortError') return

      console.error('Chat send error:', error)
      const errorMsg = error instanceof Error && error.message.includes('fetch')
        ? '❌ No se pudo conectar. Revisa tu conexión a internet.'
        : '❌ Algo salió mal. Puedes intentar de nuevo.'
      setMessages((prev) => {
        const hasAssistant = prev.some((m) => m.id === assistantId)
        const errorMessage: Message = {
          id: assistantId,
          role: 'assistant' as const,
          content: errorMsg,
          quickActions: [{ label: '🔄 Reintentar', message: lastUserTextRef.current || 'Reintentar' }],
        }
        if (hasAssistant) {
          return prev.map((m) => m.id === assistantId ? errorMessage : m)
        }
        return [...prev, errorMessage]
      })
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

  const handleQuickAction = (text: string) => {
    if (isLoading) return
    // Clear quick actions from all messages when user picks one
    setMessages((prev) => prev.map((m) => ({ ...m, quickActions: undefined })))
    sendMessage(text)
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
            onClick={() => sendMessage()}
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
      {/* Onboarding modal (first visit only) */}
      <ChatOnboarding />

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-purple-600/15 border-2 border-dashed border-purple-400/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Camera className="h-12 w-12 text-purple-400 mx-auto mb-2" />
            <p className="text-purple-200 text-lg font-medium">Suelta tu imagen aquí 📷</p>
          </div>
        </div>
      )}

      {isEmptyState ? (
        /* ── Empty state: centered like ChatGPT ── */
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="mb-6 text-center">
            <h1 className="text-[28px] font-medium bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              ¿En qué te puedo ayudar?
            </h1>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-lg">
            {suggestionChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(chip.message)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 bg-[#2f2f2f] text-sm text-white/80 hover:bg-white/10 hover:border-purple-500/30 hover:text-white transition-all disabled:opacity-40"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          <div className="w-full px-2">
            {inputBar}
          </div>

          {/* Image guide */}
          <div className="flex items-center gap-3 mt-4 text-[11px] text-white/30">
            <span>📷 JPG o PNG</span>
            <span>•</span>
            <span>hasta 50MB</span>
            <span>•</span>
            <span>✅ Fondo limpio funciona mejor</span>
          </div>
        </div>
      ) : (
        /* ── Chat state: messages + bottom input ── */
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={idx === messages.length - 1}
                  onDownloadRequest={onDownloadRequest}
                  onQuickAction={handleQuickAction}
                  generatorReady={generatorReady}
                />
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
