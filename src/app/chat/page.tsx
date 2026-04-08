'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wand2, Menu, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PosterGenerator } from '@/components/PosterGenerator'
import { ChatInterface } from '@/components/MoldeIA/ChatInterface'
import { ChatSidebar } from '@/components/MoldeIA/ChatSidebar'
import { ChatSettings } from '@/components/MoldeIA/ChatSettings'
import { type Message } from '@/components/MoldeIA/ChatMessage'
import {
  chatStorage,
  generateConversationId,
  generateTitle,
  generatePreview,
  type ConversationMeta,
  type UserSettings,
} from '@/lib/chatStorage'

type PaperSize = 'Letter' | 'Legal' | 'Tabloid' | 'A4' | 'A3'
type Orientation = 'portrait' | 'landscape'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy **MoldeIA** 🪅\n\nEnvíame la foto de tu piñata y yo me encargo de crear el molde listo para imprimir.\n\n📷 Arrastra una imagen aquí, pégala, o usa el botón de foto.',
}

export default function ChatPage() {
  const [config, setConfig] = useState<{
    targetWidth?: string
    targetHeight?: string
    paperSize?: string
    orientation?: string
  }>({})
  const [externalProcessedImage, setExternalProcessedImage] = useState<string | null | undefined>(undefined)
  const [triggerDownload, setTriggerDownload] = useState<{ format: 'pdf' | 'zip'; projectName?: string } | null>(null)
  const [generatorReady, setGeneratorReady] = useState(false)
  const currentImageRef = useRef<string | null>(null)

  // Estado del historial y sidebar
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)

  // Cargar conversaciones al montar
  useEffect(() => {
    setConversations(chatStorage.getConversations())
    setUserSettings(chatStorage.getSettings())
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        handleNewConversation()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshConversations = useCallback(() => {
    setConversations(chatStorage.getConversations())
  }, [])

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null)
    setActiveMessages([WELCOME_MESSAGE])
    setExternalProcessedImage(undefined)
    setGeneratorReady(false)
    currentImageRef.current = null
    setConfig({})
  }, [])

  const handleSelectConversation = useCallback((id: string) => {
    const conv = chatStorage.getConversation(id)
    if (conv) {
      setActiveConversationId(id)
      setActiveMessages(conv.messages.length > 0 ? conv.messages : [WELCOME_MESSAGE])
    }
  }, [])

  const handleDeleteConversation = useCallback((id: string) => {
    chatStorage.deleteConversation(id)
    refreshConversations()
    if (activeConversationId === id) {
      handleNewConversation()
    }
  }, [activeConversationId, refreshConversations, handleNewConversation])

  const handleClearHistory = useCallback(() => {
    chatStorage.clearAllConversations()
    refreshConversations()
    handleNewConversation()
  }, [refreshConversations, handleNewConversation])

  const handleMessagesChange = useCallback((messages: Message[]) => {
    // Ignorar si solo tiene el welcome message
    const realMessages = messages.filter((m) => m.id !== 'welcome')
    if (realMessages.length === 0) return

    let convId = activeConversationId
    if (!convId) {
      convId = generateConversationId()
      setActiveConversationId(convId)
    }

    const conversation = {
      id: convId,
      title: generateTitle(messages),
      createdAt: chatStorage.getConversation(convId)?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      preview: generatePreview(messages),
      messages,
    }
    chatStorage.saveConversation(conversation)
    refreshConversations()
  }, [activeConversationId, refreshConversations])

  const handleSettingsChange = useCallback((settings: UserSettings) => {
    setUserSettings(settings)
  }, [])

  const handleConfigChange = useCallback((updates: { targetWidth?: string; targetHeight?: string; paperSize?: string; orientation?: string }) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleImageLoad = useCallback((dataUrl: string) => {
    setExternalProcessedImage(dataUrl)
    currentImageRef.current = dataUrl
  }, [])

  const handleProcessedImageChange = useCallback((src: string | null) => {
    currentImageRef.current = src
    setGeneratorReady(!!src)
  }, [])

  const handleUpscaleRequest = useCallback(async () => {
    if (!currentImageRef.current) {
      toast.error('Sin imagen', { description: 'Primero envía una imagen en el chat.' })
      return
    }

    toast.loading('Mejorando imagen con IA…', { id: 'upscale' })

    try {
      let imageBase64: string
      let mimeType: string

      const src = currentImageRef.current
      if (src.startsWith('data:')) {
        const [header, data] = src.split(',')
        imageBase64 = data
        mimeType = header.match(/data:(.*);/)?.[1] ?? 'image/png'
      } else {
        const res = await fetch(src)
        const blob = await res.blob()
        mimeType = blob.type || 'image/png'
        const buffer = await blob.arrayBuffer()
        const uint8 = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i])
        }
        imageBase64 = btoa(binary)
      }

      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? 'Error en upscale')
      }

      const data = await response.json()
      const newSrc = `data:${data.mimeType};base64,${data.imageBase64}`
      setExternalProcessedImage(newSrc)
      toast.success('¡Imagen mejorada!', { id: 'upscale' })
    } catch (error) {
      console.error('Upscale error:', error)
      toast.error('Error al mejorar imagen', {
        id: 'upscale',
        description: error instanceof Error ? error.message : 'Intenta de nuevo.',
      })
    }
  }, [])

  const handleDownloadRequest = useCallback((format: 'pdf' | 'zip') => {
    const trigger = { format, projectName: 'MoldeIA-Piñata' }
    setTriggerDownload(trigger)
    setTimeout(() => setTriggerDownload(null), 8000)
  }, [])

  return (
    <div className="h-screen flex bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl flex-shrink-0 z-20">
          <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botón sidebar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="rounded-full h-8 w-8 text-white/60 hover:text-white"
              >
                <Menu className="h-4 w-4" />
              </Button>

              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-white/60 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wand2 className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">MoldeIA</span>
                  <span className="text-white/40 mx-1.5 hidden sm:inline">·</span>
                  <span className="text-xs text-white/40 hidden sm:inline">Agente de piñatas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">En línea</span>
              </div>
              {/* Botón settings */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="rounded-full h-8 w-8 text-white/60 hover:text-white"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            onConfigChange={handleConfigChange}
            onImageLoad={handleImageLoad}
            onUpscaleRequest={handleUpscaleRequest}
            onDownloadRequest={handleDownloadRequest}
            generatorReady={generatorReady}
            conversationId={activeConversationId}
            initialMessages={activeMessages}
            onMessagesChange={handleMessagesChange}
            userSettings={userSettings}
          />
        </div>

        {/* PosterGenerator OCULTO */}
        <div className="hidden">
          <PosterGenerator
            controlledWidth={config.targetWidth}
            controlledHeight={config.targetHeight}
            controlledPaperSize={config.paperSize as PaperSize | undefined}
            controlledOrientation={config.orientation as Orientation | undefined}
            externalProcessedImageSrc={externalProcessedImage}
            onProcessedImageChange={handleProcessedImageChange}
            triggerDownload={triggerDownload}
          />
        </div>
      </div>

      {/* Settings modal */}
      <ChatSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearHistory={handleClearHistory}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}
