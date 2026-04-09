'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { PanelLeft, ChevronDown, Settings, SquarePen } from 'lucide-react'
import { toast } from 'sonner'
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
    '¡Hola! Soy **MoldeGPT** 🪅\n\nEnvíame la foto de tu piñata y yo me encargo de crear el molde listo para imprimir.\n\n📷 Arrastra una imagen aquí, pégala, o usa el botón de foto.',
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

  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [sidebarOpen, setSidebarOpen] = useState(true) // abierto por defecto en desktop
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setConversations(chatStorage.getConversations())
    setUserSettings(chatStorage.getSettings())
    // En móvil, cerrar sidebar por defecto
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

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
    // En móvil, cerrar sidebar al seleccionar
    if (window.innerWidth < 768) setSidebarOpen(false)
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
    const trigger = { format, projectName: 'MoldeGPT-Piñata' }
    setTriggerDownload(trigger)
    setTimeout(() => setTriggerDownload(null), 8000)
  }, [])

  return (
    <div className="h-screen flex bg-[#212121] overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 z-20 h-11 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNewConversation}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <SquarePen className="h-5 w-5" />
                </button>
              </>
            )}
            <button className="flex items-center gap-1 text-white/80 hover:text-white transition-colors ml-1">
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">MoldeGPT</span>
              <ChevronDown className="h-3.5 w-3.5 text-purple-400/50" />
            </button>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
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

        {/* PosterGenerator oculto */}
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
